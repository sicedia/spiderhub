import os
import json
import argparse
from typing import List, Dict

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv()

import PyPDF2
from jinja2 import Template
import pypandoc

# LangChain and Gemini imports
from langchain_openai.chat_models import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
from langchain.schema import HumanMessage
from langchain.prompts import ChatPromptTemplate

# ���� NUEVAS LIBRERÍAS
from ragas.metrics import groundedness
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from selfcheckgpt import SelfCheck
import numpy as np

# Directories
PDF_DIR = 'documents'
OUTPUT_DIR = 'outputs'

# Tag taxonomy
TAG_CATEGORIES = {
    "Digital Transformation & Strategy": [
        "Digital Agenda", "Digital Acceleration", "Digital Platforms",
        "Digital Decade", "Digital Infrastructure", "Digital Trade",
        "Digital Policy", "Digital Ecosystem", "Digital Investment",
        "Digital Regulation", "Digital Transitions", "Digital Research",
        "Digital Sustainability", "Digital Economy", "Digital Skills Development"
    ],
    "Technology & Innovation": [
        "Artificial Intelligence", "AI Ethics", "Tech-Driven Solutions",
        "Quantum Technologies", "ICT Innovation", "Technology Regulations",
        "High-Performance Computing", "Sustainable Tech", "Cloud Computing",
        "Innovation in Computing", "Blockchain", "5G", "VRE"
    ],
    "Data & Governance": [
        "Data Governance", "Digital Rights", "Digital Governance", "Data Protection",
        "Cybersecurity", "Cyber Risk Management", "Data Privacy", "Digital Access",
        "Digital Identity Management", "Internet Governance", "Digital Ethics",
        "E-Governance"
    ],
    "Inclusion & Social Development": [
        "Digital Inclusion", "Social Cohesion", "Gender Equality in Tech",
        "Digital Education", "Connectivity", "Sustainable Digital Development"
    ],
    "Regional & International Cooperation": [
        "EU-LAC Digital Alliance", "Bi-regional Cooperation",
        "Global Digital Cooperation", "Multilateralism",
        "EU-CELAC Digital Partnership", "Digital & Technological Partnerships"
    ]
}

# Markdown template
TEMPLATE = Template(r"""
# {{ title }}

**Date:** {{ date }}  
**Locations:** {{ locations | join(', ') }}

## Characteristics
{{ characteristics }}

## Actors
{{ actors }}

## Main Themes
{{ main_themes }}

## Practical Applications
{{ practical_applications }}

## Resulting Commitments
{{ resulting_commitments }}

**Tags Identified:**
{% for cat, tags in identified_tags.items() %}
- **{{ cat }}:** {{ tags | join(', ') }}
{% endfor %}

[Original Document]({{ link }})
"""
)

# Utility functions
def compute_confidence(pdf_text: str, summary: str) -> float:
    """
    Devuelve un score 0-1 que combina groundedness (0.6) y consistencia (0.4).
    """
    # ---------  Groundedness  ---------
    splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
    pdf_chunks     = splitter.split_text(pdf_text)
    summary_chunks = splitter.split_text(summary)

    # indexar PDF
    store = FAISS.from_texts(pdf_chunks, OpenAIEmbeddings())

    # score por chunk
    g_scores = []
    for c in summary_chunks:
        hits   = store.similarity_search(c, k=3)
        score  = groundedness.compute(c, [h.page_content for h in hits])
        g_scores.append(score)
    groundedness_global = float(np.mean(g_scores))

    # ---------  Consistencia interna  ---------
    sc = SelfCheck(model="gpt-4o-mini")  # mismo modelo que usas para resumir
    consistency = sc.score(summary, n_generations=6)  # 0-1

    # combinación
    return 0.6 * groundedness_global + 0.4 * consistency

def extract_text(path: str) -> str:
    reader = PyPDF2.PdfReader(path)
    return '\n'.join(page.extract_text() or '' for page in reader.pages)


def identify_tags(text: str) -> Dict[str, List[str]]:
    found = {cat: [] for cat in TAG_CATEGORIES}
    for cat, kws in TAG_CATEGORIES.items():
        for kw in kws:
            if kw.lower() in text.lower():
                found[cat].append(kw)
    return {cat: tags for cat, tags in found.items() if tags}


def build_prompts():
    narrative = ChatPromptTemplate.from_messages([
        ("system", "You are an expert analyst."),
        ("human", "Read the text below and produce a long, detailed narrative summary in full sentences and paragraphs:\n\n{text}")
    ])
    fields = {
        "title": "Extract a concise, descriptive title:",
        "date": "Identify the exact document date (YYYY-MM-DD):",
        "locations": "List all countries/locations involved. Output Ecuador, Colombia, etc.",
        "characteristics": "Describe the main characteristics in detail:",
        "actors": "Detail all actors and stakeholders verbosely:",
        "main_themes": "Explain the main themes thoroughly:",
        "practical_applications": "Describe practical applications with examples:",
        "resulting_commitments": "List and explain resulting commitments:"
    }
    prompts = [narrative]
    for instr in fields.values():
        prompts.append(
            ChatPromptTemplate.from_messages([
                ("system", "You are an expert extractor."),
                ("human", f"Narrative:\n{{narrative}}\n\n{instr}")
            ])
        )
    return prompts, list(fields.keys())


def process_pdf(pdf_file: str, llm, prompts, field_keys):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(PDF_DIR, pdf_file)
    text = extract_text(path)
    tags = identify_tags(text)

    # Generate narrative
    narrative_msg = prompts[0].format_messages(text=text)[1].content
    narrative = llm.invoke([HumanMessage(content=narrative_msg)])
    narrative = narrative if isinstance(narrative, str) else narrative.content

    # 3️⃣ CAMPO: CONFIDENCE
    confidence = compute_confidence(text, narrative)

    # Extract fields
    result = {"narrative": narrative}
    for key, prompt in zip(field_keys, prompts[1:]):
        field_msg = prompt.format_messages(narrative=narrative)[1].content
        value = llm.invoke([HumanMessage(content=field_msg)])
        result[key] = value if isinstance(value, str) else value.content

    result['tags'] = tags
    result['link'] = pdf_file

    # Compose markdown
    base = os.path.splitext(pdf_file)[0]
    md = (f"## Narrative Summary\n\n{narrative}\n\n"
          f"**Confidence score:** {confidence}\n\n" +
          TEMPLATE.render(
              title=result['title'], date=result['date'],
              locations=result['locations'], characteristics=result['characteristics'],
              actors=result['actors'], main_themes=result['main_themes'],
              practical_applications=result['practical_applications'],
              resulting_commitments=result['resulting_commitments'],
              identified_tags=tags, link=pdf_file
          ))
    # Save markdown and convert to DOCX
    md_path = os.path.join(OUTPUT_DIR, f"{base}.md")
    docx_path = os.path.join(OUTPUT_DIR, f"{base}.docx")

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md)
    try:
        pypandoc.convert_file(md_path, 'docx', outputfile=docx_path)
        print(f"Processed {pdf_file}: generated {md_path}, {docx_path}")
    except Exception as e:
        print(f"Error converting {md_path} to DOCX: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--provider', choices=['openai','gemini'], default='openai')
    parser.add_argument('--model', default='gpt-4o-mini')
    args = parser.parse_args()

    # Instantiate LLM
    if args.provider == 'openai':
        api = os.getenv('OPENAI_API_KEY')
        llm = ChatOpenAI(model=args.model, openai_api_key=api)
    else:
        api = os.getenv('GOOGLE_API_KEY')
        llm = GoogleGenerativeAI(model=args.model, google_api_key=api)

    prompts, field_keys = build_prompts()

    # Process all PDFs
    for file in os.listdir(PDF_DIR):
        if file.lower().endswith('.pdf'):
            process_pdf(file, llm, prompts, field_keys)

if __name__ == '__main__':
    main()

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
from langchain.evaluation import load_evaluator, EvaluatorType

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

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
**Locations:** {{ locations }}

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
        (
        "system",
        "You are a senior policy analyst. Read the source text and write a **concise narrative "
        "summary in English**, maximum 180 words, in full sentences and paragraphs. "
        "Do **NOT** invent information; if something is missing, write: 'No information available.'."
    ),
        ("human", "Read the text below and produce a concise narrative summary in full sentences and paragraphs. If information is missing, state 'No information available.'\n\n{text}")
    ])
    fields = {
        "title": "Extract a concise, descriptive title:",
        "date": "Identify the document’s exact date in YYYY-MM-DD. If only month/year: use 'YYYY-MM'. If none: 'No information available.",
        "locations": "List all countries/locations involved.",
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
                ("system", "You are an expert extractor. Provide concise answers based strictly on the narrative. If the requested information is not present, reply 'No information available.'"),
                ("human", f"Narrative:\n{{narrative}}\n\n{instr}")
            ])
        )
    return prompts, list(fields.keys())


def process_pdf(pdf_file: str, llm, prompts, field_keys):
    logger.info(f"Start processing PDF: {pdf_file}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(PDF_DIR, pdf_file)
    text = extract_text(path)
    tags = identify_tags(text)
    logger.debug(f"Extracted text length={len(text)}; tags found={tags}")

    # Generate narrative
    narrative_msg = prompts[0].format_messages(text=text)[1].content
    narrative = llm.invoke([HumanMessage(content=narrative_msg)])
    if not isinstance(narrative, str):
        narrative = narrative.content
    logger.debug("Narrative generated")

    # —————— Add faithfulness evaluation here ——————
    # 1) LLM juez
    llm_juez = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        openai_api_key=os.getenv("LLMS_API_KEY"),
        base_url=os.getenv("LLMS_API_URL"),
    )

    # 2) Rúbrica 1-10 para fidelidad factual
    faithfulness_rubric = {
        "faithfulness": """
        Score 1: The summary is mostly unrelated or contradicts the source.
        Score 4: The summary captures some facts but adds invented details.
        Score 7: The summary is broadly faithful with minor inaccuracies/omissions.
        Score 10: The summary is perfectly faithful—no unverifiable info added.
        +"""
    }
    # 3) Cargar evaluador de puntuación
    evaluator = load_evaluator(
        "score_string",
        criteria=faithfulness_rubric,
        llm=llm_juez,
    )
    # 4) Evaluar
    res = evaluator.evaluate_strings(
        input=text,
        prediction=narrative,
    )
    score_1_10 = int(res["score"])
    score_1_100 = score_1_10 * 10
    reasoning = res["reasoning"]
    # Etiquetas cualitativas
    label = (
        "malo"     if score_1_100 < 50 else
        "regular"  if score_1_100 < 80 else
        "excelente"
    )
    faithfulness_score = score_1_100
    faithfulness_label = label
    logger.info(f"Faithfulness (0-100): {faithfulness_score} ({faithfulness_label}); reasoning={reasoning}")
    # ————————————————————————————————————————


    # Extract fields
    result = {"narrative": narrative}
    for key, prompt in zip(field_keys, prompts[1:]):
        field_msg = prompt.format_messages(narrative=narrative)[1].content
        value = llm.invoke([HumanMessage(content=field_msg)])
        result[key] = value if isinstance(value, str) else value.content
        logger.debug(f"Extracted field '{key}': {result[key]}")

    result['tags'] = tags
    result['link'] = pdf_file

    # Compose markdown
    base = os.path.splitext(pdf_file)[0]
    md_path = os.path.join(OUTPUT_DIR, f"{base}.md")
    docx_path = os.path.join(OUTPUT_DIR, f"{base}.docx")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(
            f"Métrica de confianza (0-100): {faithfulness_score} ({faithfulness_label})\n\n" 
            +"## Narrative Summary\n\n"
            + result["narrative"]
            + "\n\n"
            + TEMPLATE.render(
                title=result['title'], date=result['date'],
                locations=result['locations'], characteristics=result['characteristics'],
                actors=result['actors'], main_themes=result['main_themes'],
                practical_applications=result['practical_applications'],
                resulting_commitments=result['resulting_commitments'],
                identified_tags=tags, link=pdf_file
            )
        )
    try:
        pypandoc.convert_file(md_path, 'docx', outputfile=docx_path)
        logger.info(f"Processed {pdf_file}: generated {md_path}, {docx_path}")
    except Exception:
        logger.exception(f"Error converting {md_path} to DOCX")

    

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--provider', choices=['openai','gemini'], default='openai')
    parser.add_argument('--model', default='openai/gpt-4o')
    # gemini/gemini-2.5-flash-preview-04-17
    args = parser.parse_args()

    logger.info(f"Using provider={args.provider}, model={args.model}")

    API_KEY = os.getenv('LLMS_API_KEY')
    BASE_URL = os.getenv('LLMS_API_URL')
    # Instantiate LLM
    if args.provider == 'openai':
        llm = ChatOpenAI(model=args.model, api_key=API_KEY, base_url=BASE_URL)
    else:
        llm = GoogleGenerativeAI(model=args.model, api_key=API_KEY, base_url=BASE_URL)

    prompts, field_keys = build_prompts()

    # Process all PDFs
    for file in os.listdir(PDF_DIR):
        if file.lower().endswith('.pdf'):
            process_pdf(file, llm, prompts, field_keys)

    logger.info("All PDFs processed successfully.")


if __name__ == '__main__':
    main()

# o4 mini
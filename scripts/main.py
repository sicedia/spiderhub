#!/usr/bin/env python3
"""
main_combined.py – Merge of main.py + main_backup.py with the new extraction logic requested.

Features
========
* Extract text from PDFs under documents/ and write outputs/BASE.{md,docx,json}
* Allows --provider [openai|gemini] and --model arguments (defaults keep behaviour of main_backup.py)
* Field‑by‑field prompts (title, date, etc.)
* Locations: spaCy GPE list + principal location chosen via LLM
* Actors: spaCy ORG entities → match taxonomy → one‑paragraph importance + "Other actors" block with fuzzy‑matched classifications
* Themes, Practical Applications, Commitments → LLM
* Links → regex
* Tags Identified → separate lists (actors_vs_themes)
* Faithfulness score (0‑100) with GPT‑4o judge
* Saves .md, .docx (via Pandoc) and .json (easy to ingest later)

Requirements
============
spaCy (en_core_web_sm), rapidfuzz, PyPDF2, Jinja2, pypandoc, python‑dotenv,
langchain‑openai, langchain‑google‑genai, pandoc installed system‑wide.

Usage
=====
python main_combined.py --provider openai --model openai/gpt-4o
"""

import os
import re
import json
import argparse
import logging
from typing import List, Dict, Tuple

import spacy
from rapidfuzz import fuzz
from dotenv import load_dotenv
from jinja2 import Template
import PyPDF2
import pypandoc

# LangChain imports
from langchain_openai.chat_models import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate
from langchain.evaluation import load_evaluator

# --------------------------------------------------
# CONFIG & LOGGING
# --------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

PDF_DIR = "documents"
OUTPUT_DIR = "outputs"

load_dotenv()

# --------------------------------------------------
# TAXONOMIES (unchanged from original scripts)
# --------------------------------------------------
TAG_THEMES = {
    "Digital Transformation & Strategy": [
        "Digital Agenda", "Digital Acceleration", "Digital Platforms",
        "Digital Decade", "Digital Infrastructure", "Digital Trade",
        "Digital Policy", "Digital Ecosystem", "Digital Investment",
        "Digital Regulation", "Digital Transitions", "Digital Research",
        "Digital Sustainability", "Digital Economy", "Digital Skills Development",
    ],
    "Technology & Innovation": [
        "Artificial Intelligence", "AI Ethics", "Tech-Driven Solutions",
        "Quantum Technologies", "ICT Innovation", "Technology Regulations",
        "High-Performance Computing", "Sustainable Tech", "Cloud Computing",
        "Innovation in Computing", "Blockchain", "5G", "VRE",
    ],
    "Data & Governance": [
        "Data Governance", "Digital Rights", "Digital Governance", "Data Protection",
        "Cybersecurity", "Cyber Risk Management", "Data Privacy", "Digital Access",
        "Digital Identity Management", "Internet Governance", "Digital Ethics",
        "E-Governance",
    ],
    "Inclusion & Social Development": [
        "Digital Inclusion", "Social Cohesion", "Gender Equality in Tech",
        "Digital Education", "Connectivity", "Sustainable Digital Development",
    ],
    "Regional & International Cooperation": [
        "EU-LAC Digital Alliance", "Bi-regional Cooperation", "Global Digital Cooperation",
        "Multilateralism", "EU-CELAC Digital Partnership", "Digital & Technological Partnerships",
    ],
}

TAG_ACTORS = {
    "Political Actors": [
        "Governments", "Government Officials", "Policy Level Representatives",
        "Community of Latin American and Caribbean States", "Southern Common Market",
        "Pacific Alliance", "European Union", "EU Member States", "European Council",
        "European Parliament", "European Commission", "EU Delegations",
        "Ibero-American General Secretariat", "Community of Portuguese Language Countries",
        "International and Ibero-American Foundation for Administration and Public Policies",
        "Information and Communication Technologies and Digital Dialogue Leaders",
        "Organisation of Ibero-American States", "United Nations", "United Nations Officials",
    ],
    "Research and Innovation Actors": [
        "EU-LAC Foundation", "Research Software Alliance", "Latin American Cooperation of Advanced Networks",
        "Universities", "Technology Organisations", "Research Performing Organisations",
        "Academic Institutions", "Knowledge and Innovation Communities",
        "European Institute of Innovation and Technology", "Digital Innovation Hubs",
        "Thematic communities", "Researchers", "Innovators", "Digital for Development Hub",
        "EU-LAC Digital Alliance", "Pan-European Research and Education Network",
        "LAC Space Agencies", "National Research and Education Networks",
        "Latin American and Caribbean Network Information Centre",
        "Spanish Agency for International Development",
    ],
    "Economic Actors": [
        "Bilateral Projects", "Organisation for Economic Cooperation and Development",
        "Private Sector Representatives", "Industry Actors", "Private Sector Intermediaries",
        "Inter-American Development Bank", "Development Bank of Latin America and the Caribbean",
        "Central American Bank for Economic Integration", "World Bank",
        "Secretariat for Central American Economic Integration", "Research Funding Organisations",
        "Digital Companies", "ICT Companies", "Telecommunication Companies",
    ],
    "Civil Society Actors": [
        "Non-governmental Institutions", "Civil Society Organisations", "European Digital Rights",
        "Digital Training and Education Providers", "Digital Transformation Consultants",
        "Digital Skills Development Platforms", "Digital Cooperation Organization",
        "Digital Literacy Initiatives", "Technology Providers",
    ],
}

# --------------------------------------------------
# NLP INITIALISATION
# --------------------------------------------------
logger.info("Loading spaCy model …")
nlp = spacy.load("en_core_web_sm")

# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def extract_text(pdf_path: str) -> str:
    reader = PyPDF2.PdfReader(pdf_path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_links(text: str) -> List[str]:
    return re.findall(r"https?://\S+", text)


def fuzzy_in_list(item: str, candidates: List[str], thresh: int = 88) -> bool:
    return any(fuzz.partial_ratio(item.lower(), c.lower()) >= thresh for c in candidates)


def match_taxonomy_org(org: str) -> Tuple[str, str]:
    """Return (category, matched_name) if in taxonomy else (None, None)."""
    for cat, lst in TAG_ACTORS.items():
        for cand in lst:
            if fuzz.partial_ratio(org.lower(), cand.lower()) >= 90:
                return cat, cand
    return None, None


def classify_unknown_org(org: str) -> str:
    """Heuristic fuzzy classification of unknown ORG into nearest category label."""
    scores = {}
    for cat, lst in TAG_ACTORS.items():
        best = max([fuzz.partial_ratio(org.lower(), cand.lower()) for cand in lst] or [0])
        scores[cat] = best
    # choose cat with highest score, threshold 50
    best_cat, best_score = max(scores.items(), key=lambda x: x[1])
    return best_cat if best_score >= 50 else "Uncategorised"

# --------------------------------------------------
# PROMPT TEMPLATES
# --------------------------------------------------

def build_prompts() -> Dict[str, ChatPromptTemplate]:
    """Separate prompt per field."""
    actor_json = json.dumps(TAG_ACTORS).replace("{", "{{").replace("}", "}}").replace("\n", " ")
    theme_json = json.dumps(TAG_THEMES).replace("{", "{{").replace("}", "}}").replace("\n", " ")

    prompts = {}

    prompts["title"] = ChatPromptTemplate.from_messages([
        ("system", "You are an expert summariser. Provide a concise, descriptive title."),
        ("human", "Source text:\n\n{text}\n\nTitle:")
    ])

    prompts["date"] = ChatPromptTemplate.from_messages([
        ("system", "Extract the exact date (YYYY-MM-DD), output 'YYYY-MM-DD'. If only month/year present, output 'YYYY-MM'. If none: 'No information available.'"),
        ("human", "Source text:\n\n{text}\n\nDate:")
    ])

    prompts["principal_location"] = ChatPromptTemplate.from_messages([
        ("system", "Identify the principal location (country or city) where the event/document originates."),
        ("human", "Source text:\n\n{text}\n\nPrincipal location:")
    ])

    prompts["characteristics"] = ChatPromptTemplate.from_messages([
        ("system", "Summarise the main characteristics in 3‑6 bullet points (≤30 words each)."),
        ("human", "Source text:\n\n{text}\n\nCharacteristics:")
    ])

    prompts["themes"] = ChatPromptTemplate.from_messages([
        ("system", f"List the main themes and assign each to a sub‑category of TAG_THEMES: {theme_json}"),
        ("human", "Source text:\n\n{text}\n\nMain themes:")
    ])

    prompts["practical_applications"] = ChatPromptTemplate.from_messages([
        ("system", "Extract only concrete, actionable initiatives (programmes, MoUs, funding, pilots, policy frameworks)."),
        ("human", "Source text:\n\n{text}\n\nPractical applications:")
    ])

    prompts["commitments"] = ChatPromptTemplate.from_messages([
        ("system", "List commitments with measurable target / deadline / budget."),
        ("human", "Source text:\n\n{text}\n\nResulting commitments:")
    ])

    prompts["principal_location"] = prompts["principal_location"]  # already defined

    return prompts

# --------------------------------------------------
# LLM INITIALISATION
# --------------------------------------------------

def get_llm(provider: str, model: str):
    api_key = os.getenv("LLMS_API_KEY")
    base_url = os.getenv("LLMS_API_URL")
    if provider == "openai":
        return ChatOpenAI(model=model, api_key=api_key, base_url=base_url)
    else:
        return GoogleGenerativeAI(model=model, api_key=api_key, base_url=base_url)

# --------------------------------------------------
# FAITHFULNESS SCORE
# --------------------------------------------------

def evaluate_faithfulness(source: str, summary: str) -> Tuple[int, str]:
    llm_judge = ChatOpenAI(
        model="gpt-4o", temperature=0, api_key=os.getenv("LLMS_API_KEY"), base_url=os.getenv("LLMS_API_URL")
    )
    rubric = {
        "faithfulness": """
        Score 1: The summary is mostly unrelated or contradicts the source.
        Score 4: The summary captures some facts but adds invented details.
        Score 7: The summary is broadly faithful with minor inaccuracies/omissions.
        Score 10: The summary is perfectly faithful—no unverifiable info added.
        +"""
    }
    evaluator = load_evaluator("score_string", criteria=rubric, llm=llm_judge)
    res = evaluator.evaluate_strings(input=source, prediction=summary)
    score_10 = int(res["score"])
    score_100 = score_10 * 10
    label = "excelente" if score_100 >= 80 else "regular" if score_100 >= 50 else "malo"
    return score_100, label

# --------------------------------------------------
# PIPELINE PER PDF
# --------------------------------------------------

def process_pdf(pdf_file: str, llm, prompts):
    logger.info(f"Processing {pdf_file} …")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(PDF_DIR, pdf_file)
    text = extract_text(path)

    # Links via regex
    links = extract_links(text)

    # spaCy entities
    doc = nlp(text)
    gpe_entities = sorted({ent.text for ent in doc.ents if ent.label_ == "GPE"})
    org_entities = sorted({ent.text for ent in doc.ents if ent.label_ == "ORG"})

    # ----- IA fields -----
    field_values: Dict[str, str] = {}
    for key, tpl in prompts.items():
        if key == "principal_location":
            msg = tpl.format_messages(text=text)[1].content
        else:
            msg = tpl.format_messages(text=text)[1].content
        resp = llm.invoke([HumanMessage(content=msg)])
        field_values[key] = resp if isinstance(resp, str) else resp.content

    # Combine locations list
    principal = field_values["principal_location"].strip()
    locations_list = gpe_entities
    if principal and principal not in locations_list:
        locations_list.insert(0, principal)
    field_values["locations"] = "\n".join(f"- {loc}" for loc in locations_list) if locations_list else "No locations available."

    # ----- Actors processing -----
    in_taxonomy: Dict[str, List[str]] = {cat: [] for cat in TAG_ACTORS}
    other_actors: Dict[str, List[str]] = {cat: [] for cat in TAG_ACTORS}
    other_actors["Uncategorised"] = []  # Add this line to handle uncategorized organizations
    actor_descriptions: List[str] = []

    for org in org_entities:
        cat, matched = match_taxonomy_org(org)
        if cat:
            in_taxonomy[cat].append(matched)
            # ask LLM for one‑paragraph description
            desc_tpl = ChatPromptTemplate.from_messages([
                ("system", "Provide one paragraph (≤80 words) on why the actor is important in the given text."),
                ("human", f"Actor: {matched}\n\nSource excerpt:\n{text}\n\nParagraph:")
            ])
            desc_msg = desc_tpl.format_messages()[1].content
            desc = llm.invoke([HumanMessage(content=desc_msg)])
            desc = desc if isinstance(desc, str) else desc.content
            actor_descriptions.append(f"**{matched}** ({cat}) – {desc.strip()}")
        else:
            cat_guess = classify_unknown_org(org)
            other_actors[cat_guess].append(org)

    # Build actors markdown block
    actors_md = []
    if any(in_taxonomy.values()):
        actors_md.append("### Actors in Taxonomy")
        for cat, lst in in_taxonomy.items():
            if lst:
                actors_md.append(f"- **{cat}:** " + ", ".join(sorted(set(lst))))
    if actor_descriptions:
        actors_md.append("\n**Importance:**")
        actors_md.extend(actor_descriptions)
    if any(other_actors.values()):
        actors_md.append("\n### Other actors (classified)")
        for cat, lst in other_actors.items():
            if lst:
                actors_md.append(f"- **{cat}:** " + ", ".join(sorted(set(lst))))
    field_values["actors_block"] = "\n".join(actors_md) if actors_md else "No actors available."

    # ----- Tags Identified -----
    # Actors tags = unique taxonomy names matched + guessed; Themes tags = extracted via LLM themes
    actor_tags = sorted({tag for cat in TAG_ACTORS for tag in TAG_ACTORS[cat] if tag.lower() in (x.lower() for x in org_entities)})
    theme_tags_llm = field_values["themes"]
    # crude extraction: words within backticks or list items – fallback to regex of known theme keywords
    theme_tags = []
    for cat, kws in TAG_THEMES.items():
        for kw in kws:
            if re.search(rf"\b{re.escape(kw)}\b", theme_tags_llm, re.I):
                theme_tags.append(kw)
    field_values["tags_identified"] = (
        "**Actors:** " + ", ".join(actor_tags) + "\n**Themes:** " + ", ".join(theme_tags)
        if actor_tags or theme_tags else "No tags identified."
    )

    # ----- Faithfulness score for themes (we treat themes text as summary) -----
    faithfulness_score, faithfulness_label = evaluate_faithfulness(text, field_values["themes"])

    # --------------------------------------------------
    # WRITE OUTPUTS
    # --------------------------------------------------
    base = os.path.splitext(pdf_file)[0]

    # JSON
    json_path = os.path.join(OUTPUT_DIR, f"{base}.json")
    json.dump({**field_values, "faithfulness": faithfulness_score}, open(json_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # Markdown (template)
    md_template = Template(r"""
Métrica de confianza (0‑100): {{ score }} ({{ label }})

# {{ title }}

**Date:** {{ date }}  
**Locations:**
{{ locations }}

## Characteristics
{{ characteristics }}

## Actors
{{ actors_block }}

## Main Themes
{{ themes }}

## Practical Applications
{{ practical_applications }}

## Resulting Commitments
{{ commitments }}

## Links
{% for link in links %}- {{ link }}
{% endfor %}

### Tags Identified
{{ tags_identified }}
""")

    md_content = md_template.render(
        score=faithfulness_score,
        label=faithfulness_label,
        title=field_values["title"],
        date=field_values["date"],
        locations=field_values["locations"],
        characteristics=field_values["characteristics"],
        actors_block=field_values["actors_block"],
        themes=field_values["themes"],
        practical_applications=field_values["practical_applications"],
        commitments=field_values["commitments"],
        links=links,
        tags_identified=field_values["tags_identified"],
    )

    md_path = os.path.join(OUTPUT_DIR, f"{base}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    # DOCX via Pandoc
    docx_path = os.path.join(OUTPUT_DIR, f"{base}.docx")
    try:
        pypandoc.convert_file(md_path, "docx", outputfile=docx_path)
    except Exception:
        logger.exception("Pandoc conversion failed – ensure pandoc is installed.")

    logger.info(f"Finished {pdf_file} → {md_path}, {docx_path}, {json_path}")

# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["openai", "gemini"], default="openai")
    parser.add_argument("--model", default="openai/gpt-4o")
    args = parser.parse_args()

    logger.info(f"Provider={args.provider} · Model={args.model}")
    llm = get_llm(args.provider, args.model)
    prompts = build_prompts()

    for pdf in os.listdir(PDF_DIR):
        if pdf.lower().endswith(".pdf"):
            process_pdf(pdf, llm, prompts)
    logger.info("All PDFs processed.")

if __name__ == "__main__":
    main()

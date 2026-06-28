from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
from PyPDF2 import PdfReader
import os
import json
import re

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return {"message": "Backend Running"}


@app.route("/analyze", methods=["POST"])
def analyze_resume():
    try:
        pdf_file = request.files["resume"]
        job_description = request.form["job_description"]

        reader = PdfReader(pdf_file)

        resume_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                resume_text += text + " "

        prompt = f"""
You are an ATS Resume Analyzer.

Compare the resume with the job description carefully.

Resume:
{resume_text}

Job Description:
{job_description}

Your task:

1. Calculate an ATS score between 0 and 100.

2. Find ONLY the skills that are present in the Job Description but NOT present in the Resume.

3. Do NOT guess or invent skills.

4. If the resume already contains all required skills, return:
"missing_skills": []

5. Give exactly 3 improvement suggestions based on the resume and job description.

Return ONLY valid JSON.

Example:

{{
    "score": 82,
    "missing_skills": [
        "GST",
        "SAP"
    ],
    "suggestions": [
        "Add measurable achievements.",
        "Mention relevant certifications.",
        "Improve ATS keywords."
    ]
}}

Rules:
- Return ONLY JSON.
- No markdown.
- No explanation.
- Do not invent missing skills.
- Missing skills must come ONLY from the Job Description.
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = response.choices[0].message.content.strip()

        match = re.search(r"\{.*\}", content, re.DOTALL)

        if not match:
            raise Exception("Invalid JSON returned by AI")

        data = json.loads(match.group())

        score = int(data.get("score", 0))

        missing_skills = data.get("missing_skills", [])
        suggestions = data.get("suggestions", [])

      

        return jsonify({
              "score": score,
              "missing_skills": missing_skills,
              "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({
              "score": 0,
              "missing_skills": [],
              "suggestions": [],
              "error": str(e)
        }), 500


@app.route("/translate", methods=["POST"])
def translate():
    try:
        data = request.json

        text = data["text"]
        direction = data["direction"]

        if direction == "en-hi":
            prompt = f"""
Translate the following English text to Hindi.

Return only translated text.

{text}
"""


        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return jsonify({
            "translation": response.choices[0].message.content.strip()
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
import os
import requests

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

HF_TOKEN = os.getenv("HF_TOKEN")

API_URL = "https://router.huggingface.co/v1/chat/completions"

MODEL = "Qwen/Qwen3-4B-Instruct-2507"


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "ThinkTank AI backend is running"
    })


@app.route("/ask", methods=["POST"])
def ask_ai():
    try:
        data = request.get_json()

        question = data.get("question", "").strip()

        if not question:
            return jsonify({
                "error": "Question is required"
            }), 400

        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are ThinkTank AI, a friendly educational AI tutor. "
                        "Explain concepts clearly and simply. "
                        "Use examples when helpful. "
                        "Support English and Tanglish where appropriate."
                    )
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }

        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )

        if response.status_code != 200:
            return jsonify({
                "error": "Hugging Face API error",
                "details": response.text
            }), response.status_code

        result = response.json()

        answer = result["choices"][0]["message"]["content"]

        return jsonify({
            "answer": answer
        })

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


CODE_TUTOR_SYSTEM_PROMPT = (
    "You are an expert programming tutor for beginner engineering students.\n"
    "Your goal is not simply to solve programming problems. Your goal is to help the student understand how and why the code works.\n"
    "When a student provides code:\n"
    "1. Identify the programming language.\n"
    "2. Identify the main programming concepts.\n"
    "3. Explain the concepts in simple language.\n"
    "4. Explain what the complete program does.\n"
    "5. Explain meaningful lines of code one by one with 'why it is needed'.\n"
    "6. Explain the execution flow in numbered steps.\n"
    "7. Identify relevant beginner mistakes.\n"
    "8. Create a simple practice task using the same concept with difficulty level (Beginner/Easy/Intermediate).\n"
    "9. Give hints instead of immediately giving the solution.\n"
    "Always return STRICT valid JSON only with no markdown wrapping outside the JSON."
)


@app.route("/explain-code", methods=["POST"])
def explain_code():
    try:
        data = request.get_json() or {}
        code = data.get("code", "").strip()
        selected_language = data.get("language", "Auto Detect")

        if not code:
            return jsonify({"error": "Code is required"}), 400

        user_prompt = (
            f"Selected Language by User: {selected_language}\n"
            f"Code snippet:\n```\n{code}\n```\n\n"
            "Analyze this code and respond with a JSON object following this exact schema:\n"
            "{\n"
            '  "language": "Detected Language Name",\n'
            '  "language_mismatch_warning": "Warning string if selected language differs from detected, otherwise null",\n'
            '  "concept": {\n'
            '    "title": "Main Concept Name",\n'
            '    "explanation": "Clear, friendly explanation of the main concept."\n'
            "  },\n"
            '  "program_summary": "Short 1-2 sentence explanation of what this complete program does.",\n'
            '  "line_by_line": [\n'
            "    {\n"
            '      "line": 1,\n'
            '      "code": "exact line code",\n'
            '      "explanation": "What this line does in simple student-friendly terms",\n'
            '      "why": "Why it is needed / what happens when it executes",\n'
            '      "important_concept": "Key syntax or concept highlight (optional)"\n'
            "    }\n"
            "  ],\n"
            '  "execution_flow": [\n'
            '    "Step 1...",\n'
            '    "Step 2..."\n'
            "  ],\n"
            '  "concepts_used": [\n'
            '    {"name": "Concept Name", "explanation": "One line explanation"}\n'
            "  ],\n"
            '  "common_mistakes": [\n'
            '    {"mistake": "Mistake Title / Description", "explanation": "Why it happens and how to fix it"}\n'
            "  ],\n"
            '  "practice_task": {\n'
            '    "title": "Task Title",\n'
            '    "description": "Clear practice prompt based on the same concept",\n'
            '    "difficulty": "Beginner",\n'
            '    "concepts": ["Concept 1", "Concept 2"],\n'
            '    "hints": ["Hint 1", "Hint 2"],\n'
            '    "reference_solution": "Complete reference code for this task",\n'
            '    "solution_explanation": [\n'
            '      {"line": 1, "code": "...", "explanation": "..."}\n'
            "    ]\n"
            "  }\n"
            "}\n"
            "Return ONLY raw valid JSON."
        )

        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": CODE_TUTOR_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 2048,
            "temperature": 0.4
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            return jsonify({"error": "Hugging Face API error", "details": response.text}), response.status_code

        result = response.json()
        raw_text = result["choices"][0]["message"]["content"].strip()
        cleaned = raw_text.replace("```json", "").replace("```", "").strip()

        import json
        parsed = json.loads(cleaned)
        return jsonify(parsed)

    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route("/evaluate-code", methods=["POST"])
def evaluate_code():
    try:
        data = request.get_json() or {}
        student_code = data.get("student_code", "").strip()
        task_description = data.get("task_description", "")
        original_concept = data.get("original_concept", "")
        language = data.get("language", "Python")

        if not student_code:
            return jsonify({"error": "Student code is required"}), 400

        user_prompt = (
            f"Language: {language}\n"
            f"Original Concept: {original_concept}\n"
            f"Task Given to Student: {task_description}\n"
            f"Student's Submitted Solution:\n```\n{student_code}\n```\n\n"
            "Evaluate the student's solution constructively. Respond with a JSON object following this exact schema:\n"
            "{\n"
            '  "what_you_did_well": "Mention the correct parts and encouraging aspects",\n'
            '  "what_needs_improvement": "Explain errors or edge cases clearly without being harsh",\n'
            '  "hint": "Constructive nudge or hint toward fixing any remaining issue",\n'
            '  "understanding": "Concept Understood" | "Partially Understood" | "Needs More Practice",\n'
            '  "is_correct": true | false\n'
            "}\n"
            "Return ONLY raw valid JSON."
        )

        headers = {
            "Authorization": f"Bearer {HF_TOKEN}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "You are a warm, constructive programming tutor evaluating a student's practice task solution."},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.4
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            return jsonify({"error": "Hugging Face API error", "details": response.text}), response.status_code

        result = response.json()
        raw_text = result["choices"][0]["message"]["content"].strip()
        cleaned = raw_text.replace("```json", "").replace("```", "").strip()

        import json
        parsed = json.loads(cleaned)
        return jsonify(parsed)

    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
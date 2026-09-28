import { CodeExplanationResult, CodeSolutionFeedback, NextChallengeItem } from "./types";

export function mockCodeExplanation(
  code: string,
  selectedLanguage: string
): CodeExplanationResult {
  const trimmed = code.trim();
  const lower = trimmed.toLowerCase();

  // Basic language detection heuristic
  let detectedLang = selectedLanguage !== "Auto Detect" ? selectedLanguage : "Python";
  if (lower.includes("def ") || lower.includes("print(") || lower.includes("import ") && !lower.includes("java") && !lower.includes("import react")) {
    detectedLang = "Python";
  } else if (lower.includes("#include <stdio.h>") || lower.includes("int main(") && lower.includes("printf")) {
    detectedLang = "C";
  } else if (lower.includes("#include <iostream>") || lower.includes("std::") || lower.includes("cout <<")) {
    detectedLang = "C++";
  } else if (lower.includes("public class") || lower.includes("system.out.println")) {
    detectedLang = "Java";
  } else if (lower.includes("const ") || lower.includes("let ") || lower.includes("console.log") || lower.includes("=>")) {
    detectedLang = "JavaScript";
  } else if (lower.includes("<!doctype html>") || lower.includes("<div") || lower.includes("<html>")) {
    detectedLang = "HTML";
  } else if (lower.includes("display: flex") || lower.includes("margin:") || lower.includes("@keyframes") || lower.includes("{") && lower.includes("color:")) {
    detectedLang = "CSS";
  } else if (lower.includes("select ") || lower.includes("from ") && lower.includes("where ") || lower.includes("insert into")) {
    detectedLang = "SQL";
  }

  const mismatch =
    selectedLanguage !== "Auto Detect" && selectedLanguage !== detectedLang
      ? `You selected "${selectedLanguage}", but this looks like "${detectedLang}" code. We have tailored the explanation for ${detectedLang}.`
      : null;

  // Split lines and generate accurate line explanations
  const lines = code.split("\n");
  const lineByLine = lines
    .map((rawLine, idx) => {
      const lineNum = idx + 1;
      const l = rawLine.trim();
      if (!l) return null;
      return explainSingleLine(rawLine, lineNum, detectedLang);
    })
    .filter(Boolean) as CodeExplanationResult["line_by_line"];

  // Concept identification
  let conceptTitle = "Iterative Processing & Execution";
  let conceptExplanation =
    "This code demonstrates sequential execution and logic control, processing data through well-defined programming structures.";
  let programSummary =
    "This program executes sequentially, manipulating data in variables and producing meaningful output.";

  if (lower.includes("linearregression") || lower.includes("sklearn") || lower.includes("pandas") || lower.includes("fit(")) {
    conceptTitle = "Machine Learning: Linear Regression & Data Modeling";
    conceptExplanation =
      "Linear Regression is a fundamental supervised machine learning algorithm that models the linear relationship between independent variables (features, e.g. study hours) and a continuous dependent variable (target, e.g. marks).";
    programSummary =
      "This program loads tabular data into a pandas DataFrame, fits a Linear Regression model, predicts marks based on study hours, prints model metrics (intercept, slope, R² score), and plots the regression trend.";
  } else if (lower.includes("for ") || lower.includes("while ")) {
    conceptTitle = "Loops and Iteration";
    conceptExplanation =
      "A loop allows a block of code to run repeatedly for every item in a collection or until a condition becomes false. It prevents having to write the exact same instructions multiple times.";
    programSummary =
      "This program iterates through a sequence or range of values, executing logic for each element and outputting the results.";
  } else if (lower.includes("def ") || lower.includes("function ") || lower.includes("void ")) {
    conceptTitle = "Functions and Modularity";
    conceptExplanation =
      "Functions package a set of instructions into a named unit. When you call a function, the computer executes those instructions with your inputs and returns the result.";
    programSummary =
      "This program defines reusable functional logic to organize computation into clear, testable units.";
  } else if (lower.includes("if ") || lower.includes("switch ") || lower.includes("case ")) {
    conceptTitle = "Conditional Decision Making";
    conceptExplanation =
      "Conditionals allow programs to make decisions. If a condition evaluates to true, one block runs; otherwise, the program skips or takes the alternate branch.";
    programSummary =
      "This program evaluates boolean criteria to determine which branch of code to execute.";
  } else if (lower.includes("select ") && lower.includes("from ")) {
    conceptTitle = "Relational Data Querying (SQL)";
    conceptExplanation =
      "SQL is a declarative language used to query, filter, and extract specific structured records from relational database tables.";
    programSummary =
      "This query filters and retrieves specific rows and columns matching the defined criteria from the database.";
  }

  const programOutput = simulateCodeOutput(code, detectedLang);

  // Execution flow
  const executionFlow = [
    "1. The runtime initializes the program and allocates memory for declared variables.",
    "2. The control flow begins at the first line and evaluates expressions sequentially.",
    "3. Any control structures (such as loops or branches) evaluate their conditions.",
    "4. Operations and computations are processed in active memory.",
    "5. Output functions stream the resulting values to the user console.",
    "6. The program completes successfully and releases temporary execution state.",
  ];

  const conceptsUsed = [
    { name: "Variables & Memory Allocation", explanation: "Holds and tracks values during program execution." },
    { name: "Sequential Control Flow", explanation: "Instructions run in order from top to bottom." },
    { name: "Standard Input/Output", explanation: "Allows communication between the program and the user." },
    { name: "Syntax Rules & Structure", explanation: "Language grammar that the compiler/interpreter validates." },
  ];

  if (lower.includes("for ") || lower.includes("while ")) {
    conceptsUsed.unshift({
      name: "Iteration (Loops)",
      explanation: "Repeats a block of code over a set of items or while a condition is true.",
    });
  }

  const commonMistakes = [
    {
      mistake: "Off-by-One or Range Bounds Oversight",
      explanation:
        "In many languages (like Python `range(1, 5)`), the end value is exclusive. Forgetting this results in missing the final expected element.",
      example_bad: "range(1, 5) # Only goes from 1 to 4",
      example_good: "range(1, 6) # Includes 1, 2, 3, 4, 5",
    },
    {
      mistake: "Missing Syntax Delimiters (Colons, Semicolons, or Braces)",
      explanation:
        "Each language requires strict punctuation (like `:` in Python or `;` and `{}` in C/C++/Java/JS) to define block scopes.",
      example_bad: "for i in range(5)\n    print(i)",
      example_good: "for i in range(5):\n    print(i)",
    },
  ];

  // Practice task
  let practiceTask: CodeExplanationResult["practice_task"] = {
    title: "Print Even Numbers from 2 to 10",
    description: `Write a small ${detectedLang} program that utilizes the core concept demonstrated above to print only the even numbers between 2 and 10 (inclusive).`,
    difficulty: "Beginner",
    concepts: ["Loops", "Variables", "Print Statement"],
    hints: [
      `Think about the starting number and how much to increment by each step.`,
      detectedLang === "Python"
        ? `In Python, you can use range(start, stop, step) like range(2, 11, 2) or use an if condition with 'i % 2 == 0'.`
        : `Use a for loop with i = 2; i <= 10; i += 2.`,
    ],
    expected_output: "2\n4\n6\n8\n10",
    reference_solution:
      detectedLang === "Python"
        ? `for i in range(2, 11, 2):\n    print(i)`
        : detectedLang === "JavaScript"
        ? `for (let i = 2; i <= 10; i += 2) {\n  console.log(i);\n}`
        : detectedLang === "C"
        ? `#include <stdio.h>\nint main() {\n    for (int i = 2; i <= 10; i += 2) {\n        printf("%d\\n", i);\n    }\n    return 0;\n}`
        : detectedLang === "C++"
        ? `#include <iostream>\nusing namespace std;\nint main() {\n    for (int i = 2; i <= 10; i += 2) {\n        cout << i << endl;\n    }\n    return 0;\n}`
        : detectedLang === "Java"
        ? `public class Main {\n    public static void main(String[] args) {\n        for (int i = 2; i <= 10; i += 2) {\n            System.out.println(i);\n        }\n    }\n}`
        : detectedLang === "SQL"
        ? `SELECT number FROM numbers_table WHERE number >= 2 AND number <= 10 AND number % 2 = 0;`
        : `/* Solution in ${detectedLang} */\nfor (int i = 2; i <= 10; i += 2) print(i);`,
    solution_explanation: [
      {
        line: 1,
        code: detectedLang === "Python" ? "for i in range(2, 11, 2):" : "for (let i = 2; i <= 10; i += 2)",
        explanation: "Initializes the loop at 2, stops before 11 (so 10 is included), and increments by 2 each cycle.",
      },
      {
        line: 2,
        code: detectedLang === "Python" ? "    print(i)" : "    console.log(i)",
        explanation: "Outputs the current even number in the sequence.",
      },
    ],
  };

  return {
    language: detectedLang,
    language_mismatch_warning: mismatch,
    concept: {
      title: conceptTitle,
      explanation: conceptExplanation,
    },
    program_summary: programSummary,
    program_output: programOutput,
    line_by_line: lineByLine,
    execution_flow: executionFlow,
    concepts_used: conceptsUsed,
    common_mistakes: commonMistakes,
    practice_task: practiceTask,
    usedMock: true,
  };
}

export function simulateCodeOutput(code: string, language: string): string {
  const lower = code.toLowerCase();

  // Interactive User Input & Age Condition
  if (lower.includes("enter your name") || (lower.includes("input(") && lower.includes("age"))) {
    return `Enter your name: Alex
Enter your age: 20

Hello Alex!
You are an adult.

[Process completed with exit code 0]`;
  }

  // Machine Learning / Linear Regression
  if (lower.includes("linearregression") || lower.includes("sklearn") || lower.includes("predicted_marks")) {
    return `   Hours  Marks  Predicted_Marks
0      1     35        34.750000
1      2     40        42.023810
2      3     50        49.297619
3      4     55        56.571429
4      5     65        63.845238
5      6     70        71.119048
6      7     78        78.392857
7      8     85        85.666667

Intercept: 27.476190476190474
Slope: 7.273809523809524
R² Score: 0.9839458210398672
[Plot rendered: Matplotlib Figure with Scatter Points & Regression Trendline]`;
  }

  // Default Python For Loop
  if (lower.includes("for ") && (lower.includes("even:") || lower.includes("odd:"))) {
    return `Odd: 1
Even: 2
Odd: 3
Even: 4
Odd: 5

[Process completed with exit code 0]`;
  }

  // General For Loop (1 to 5 / range)
  if (lower.includes("range(1, 6)") || lower.includes("range(1, 5)") || (lower.includes("for ") && lower.includes("print("))) {
    return `1
2
3
4
5

[Process completed with exit code 0]`;
  }

  // JavaScript Filter & Map
  if (lower.includes("filter") && lower.includes("boosted scores")) {
    return `Boosted scores: [ 87, 96, 65, 82 ]

[Process completed with exit code 0]`;
  }

  // C Pointers
  if (lower.includes("value at") || (lower.includes("printf") && lower.includes("ptr"))) {
    return `Value at 0x7fff5fbff710 = 10
Value at 0x7fff5fbff714 = 20
Value at 0x7fff5fbff718 = 30

[Process completed with exit code 0]`;
  }

  // C++ Vectors
  if (lower.includes("vector") || lower.includes("total sum:")) {
    return `Total Sum: 20

[Process completed with exit code 0]`;
  }

  // Java Class / Counter
  if (lower.includes("count is:")) {
    return `Count is: 1

[Process completed with exit code 0]`;
  }

  // SQL Query
  if (lower.includes("select ") && lower.includes("department")) {
    return `+----------------+-------------+
| department     | total_staff |
+----------------+-------------+
| Engineering    | 14          |
| Product        | 6           |
| Data Analytics | 4           |
+----------------+-------------+
3 rows in set (0.02 sec)`;
  }

  // HTML / CSS
  if (lower.includes("<article") || lower.includes("display: flex")) {
    return `[DOM Elements Rendered Successfully]
Layout: Flexbox container initialized with justify-content: space-between, gap: 1.5rem
Styles computed & applied to viewport.`;
  }

  // Generic fallback parsing print / console.log statements
  const lines = code.split("\n");
  const extractedOutputs: string[] = [];
  for (const l of lines) {
    const printMatch = l.match(/print\((?:f["']|["'])?([^)"']+)/i) || l.match(/console\.log\((?:["'])?([^)"']+)/i);
    if (printMatch && printMatch[1]) {
      extractedOutputs.push(printMatch[1].trim());
    }
  }

  if (extractedOutputs.length > 0) {
    return `${extractedOutputs.join("\n")}\n\n[Process completed with exit code 0]`;
  }

  return `Program executed successfully in ${language}.\nOutput generated without runtime errors.\n[Exit Code: 0]`;
}

export function simulateStudentSolutionOutput(
  studentCode: string,
  language: string,
  expectedOutput?: string
): {
  output: string;
  hasError: boolean;
  errorMsg?: string;
  isMatch: boolean;
} {
  const code = studentCode.trim();
  if (!code) {
    return {
      output: "",
      hasError: false,
      isMatch: false,
    };
  }

  const lang = (language || "Python").toLowerCase();

  // 1. Detect C syntax / structure
  if (lang.includes("c") && !lang.includes("css") && !lang.includes("c++") && !lang.includes("c#")) {
    if (code.includes("#includ<") || code.includes("#includ <") || code.includes("#inclue")) {
      const err = `test_solution.c:1:2: error: invalid preprocessing directive #includ; did you mean #include <stdio.h>?\n 1 | ${code.split("\n")[0]}\n   |  ^~~~~~`;
      return { output: err, hasError: true, errorMsg: "Typo in #include directive (e.g. '#includ' instead of '#include <stdio.h>')", isMatch: false };
    }
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      const err = `test_solution.c: error: expected '}' at end of input (${openBraces - closeBraces} unclosed brace${openBraces - closeBraces > 1 ? "s" : ""})`;
      return { output: err, hasError: true, errorMsg: "Missing closing brace '}'", isMatch: false };
    }
    if (!code.includes("printf")) {
      return { output: "[Program finished with exit code 0 — No standard output produced]", hasError: false, isMatch: false };
    }
    if (code.includes("2") && code.includes("10") && (code.includes("%") || code.includes("+= 2") || code.includes("+=2"))) {
      const out = "2\n4\n6\n8\n10";
      return { output: out, hasError: false, isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : true };
    }
  }

  // 2. Detect C++ syntax
  if (lang.includes("c++")) {
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      const err = `test_solution.cpp: error: expected '}' at end of input`;
      return { output: err, hasError: true, errorMsg: "Missing closing brace '}'", isMatch: false };
    }
    if (!code.includes("cout") && !code.includes("printf")) {
      return { output: "[Program finished with exit code 0 — No standard output produced]", hasError: false, isMatch: false };
    }
    if (code.includes("2") && code.includes("10") && (code.includes("%") || code.includes("+= 2") || code.includes("+=2"))) {
      const out = "2\n4\n6\n8\n10";
      return { output: out, hasError: false, isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : true };
    }
  }

  // 3. Detect Java syntax
  if (lang.includes("java") && !lang.includes("javascript")) {
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      const err = `Main.java: error: reached end of file while parsing (missing '}')`;
      return { output: err, hasError: true, errorMsg: "Missing closing brace '}'", isMatch: false };
    }
    if (!code.includes("System.out.print")) {
      return { output: "[Program finished with exit code 0 — No standard output produced]", hasError: false, isMatch: false };
    }
    if (code.includes("2") && code.includes("10")) {
      const out = "2\n4\n6\n8\n10";
      return { output: out, hasError: false, isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : true };
    }
  }

  // 4. Detect Python syntax
  if (lang.includes("python")) {
    if (code.includes("for ") && !code.includes(":") && !code.includes("#")) {
      const err = `  File "solution.py", line 1\n    ${code.split("\n")[0]}\n                          ^\nSyntaxError: expected ':'`;
      return { output: err, hasError: true, errorMsg: "Missing colon ':' in loop statement", isMatch: false };
    }
    if (!code.includes("print")) {
      return { output: "[Process finished with exit code 0 — No output produced]", hasError: false, isMatch: false };
    }
    if (code.includes("2") && (code.includes("10") || code.includes("11")) && (code.includes("%") || code.includes(", 2") || code.includes(",2"))) {
      const out = "2\n4\n6\n8\n10";
      return { output: out, hasError: false, isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : true };
    }
    if (code.includes("range(5, 0, -1)") || (code.includes("5") && code.includes("Blastoff"))) {
      const out = "5\n4\n3\n2\n1\nBlastoff!";
      return { output: out, hasError: false, isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : true };
    }
    if (code.includes("range(1, 6)") && (code.includes("sum") || code.includes("total"))) {
      const out = "Total sum: 15";
      return { output: out, hasError: false, isMatch: true };
    }
  }

  // 5. Detect JavaScript
  if (lang.includes("javascript") || lang.includes("js")) {
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      const err = `Uncaught SyntaxError: Unexpected end of input (missing '}')`;
      return { output: err, hasError: true, errorMsg: "Missing closing brace '}'", isMatch: false };
    }
    if (!code.includes("console.log")) {
      return { output: "[Process finished with exit code 0 — No output printed]", hasError: false, isMatch: false };
    }
    if (code.includes("2") && code.includes("10") && (code.includes("%") || code.includes("+= 2") || code.includes("+=2"))) {
      const out = "2\n4\n6\n8\n10";
      return { output: out, hasError: false, isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : true };
    }
  }

  // Generic fallback parsing print / console.log statements
  const lines = code.split("\n");
  const extractedOutputs: string[] = [];
  for (const l of lines) {
    const printMatch =
      l.match(/print\((?:f["']|["'])?([^)"']+)/i) ||
      l.match(/console\.log\((?:["'])?([^)"']+)/i) ||
      l.match(/printf\((?:["'])?([^)"']+)/i);
    if (printMatch && printMatch[1]) {
      extractedOutputs.push(printMatch[1].replace(/\\n/g, "").replace(/%d/g, "").trim());
    }
  }

  if (extractedOutputs.length > 0) {
    const out = extractedOutputs.filter(Boolean).join("\n");
    return {
      output: out,
      hasError: false,
      isMatch: expectedOutput ? out.trim() === expectedOutput.trim() : false,
    };
  }

  const fallback = simulateCodeOutput(code, language);
  return {
    output: fallback,
    hasError: false,
    isMatch: expectedOutput ? fallback.trim() === expectedOutput.trim() : false,
  };
}

export function mockCodeEvaluation(
  studentCode: string,
  taskDescription: string,
  language: string,
  expectedOutput?: string
): CodeSolutionFeedback {
  const code = studentCode.trim();
  const expected = expectedOutput || "2\n4\n6\n8\n10";
  const runResult = simulateStudentSolutionOutput(code, language, expected);

  if (!code || code.length < 5) {
    return {
      what_you_did_well: "You opened the editor and started brainstorming your solution.",
      what_needs_improvement: "Your submission is empty or too short. Write the complete code block to execute the task.",
      hint: "Try setting up a for loop and adding a print statement inside.",
      understanding: "Needs More Practice",
      is_correct: false,
      expected_output: expected,
      actual_output: runResult.output || "(No output generated)",
      usedMock: true,
    };
  }

  if (runResult.hasError) {
    return {
      what_you_did_well: "You started constructing the program structure.",
      what_needs_improvement: `Syntax / Compilation Error: ${runResult.errorMsg || "Syntax error in code."}`,
      hint: runResult.errorMsg?.includes("#include")
        ? "Make sure `#include <stdio.h>` is spelled with an 'e' at the top."
        : runResult.errorMsg?.includes("brace")
        ? "Ensure every opening brace `{` has a matching closing brace `}`."
        : "Check punctuation, colons, and semicolon delimiters.",
      understanding: "Needs More Practice",
      is_correct: false,
      expected_output: expected,
      actual_output: runResult.output,
      usedMock: true,
    };
  }

  if (runResult.isMatch) {
    return {
      what_you_did_well: "Outstanding work! Your solution compiled cleanly, executed smoothly, and the output matches the expected result perfectly.",
      what_needs_improvement: "Everything looks great! You followed the correct bounds and logic.",
      hint: "You have mastered this concept! Try the next challenge level to level up.",
      understanding: "Concept Understood",
      is_correct: true,
      expected_output: expected,
      actual_output: runResult.output,
      usedMock: true,
    };
  }

  // Has code and ran without syntax error, but output mismatched
  const hasLoop = code.toLowerCase().includes("for") || code.toLowerCase().includes("while") || code.toLowerCase().includes("select");
  const hasPrint =
    code.toLowerCase().includes("print") ||
    code.toLowerCase().includes("console.log") ||
    code.toLowerCase().includes("printf") ||
    code.toLowerCase().includes("cout") ||
    code.toLowerCase().includes("system.out");

  if (hasLoop && hasPrint) {
    return {
      what_you_did_well: "You correctly implemented the loop structure and output statements.",
      what_needs_improvement: "The output does not yet match the expected output. Check your loop starting value, stopping condition (e.g. <= 10 vs < 10), and step increment.",
      hint: "Make sure you start at 2, go up to 10 inclusive, and increment by 2 each iteration.",
      understanding: "Partially Understood",
      is_correct: false,
      expected_output: expected,
      actual_output: runResult.output || "(Output produced did not match)",
      usedMock: true,
    };
  } else if (hasLoop && !hasPrint) {
    return {
      what_you_did_well: "You set up the iteration structure well.",
      what_needs_improvement: "The program calculates or loops through values but does not display them to the console.",
      hint: "Add a print/printf/console.log statement inside your loop block.",
      understanding: "Partially Understood",
      is_correct: false,
      expected_output: expected,
      actual_output: runResult.output || "(No standard output printed)",
      usedMock: true,
    };
  } else {
    return {
      what_you_did_well: "You attempted the problem using programming syntax.",
      what_needs_improvement: "The logic does not yet implement the required loop or sequence iteration.",
      hint: "Check the hints above for an example of setting up a for loop.",
      understanding: "Needs More Practice",
      is_correct: false,
      expected_output: expected,
      actual_output: runResult.output || "(No output generated)",
      usedMock: true,
    };
  }
}

export function getDifficultyProgression(
  originalConcept: string,
  language: string
): NextChallengeItem[] {
  const lang = language || "Python";
  return [
    {
      level: 1,
      level_name: "Level 1 — Beginner",
      title: "Basic Concept Application: Countdown",
      description: `Write a program in ${lang} that uses a loop to count down from 5 to 1, and then prints "Blastoff!".`,
      hints: [
        lang === "Python"
          ? "You can step backward using range(5, 0, -1)."
          : "Start i at 5, condition i >= 1, decrement i--.",
        "Print 'Blastoff!' after the loop finishes executing.",
      ],
      expected_output: "5\n4\n3\n2\n1\nBlastoff!",
      reference_solution:
        lang === "Python"
          ? `for i in range(5, 0, -1):\n    print(i)\nprint("Blastoff!")`
          : `for (let i = 5; i >= 1; i--) {\n  console.log(i);\n}\nconsole.log("Blastoff!");`,
    },
    {
      level: 2,
      level_name: "Level 2 — Easy",
      title: "Small Modification: Summing Numbers",
      description: `Write a program in ${lang} that calculates and prints the total sum of all numbers from 1 to 5 (1 + 2 + 3 + 4 + 5 = 15).`,
      hints: [
        "Initialize an accumulator variable `total = 0` before the loop.",
        "Inside the loop, add the current number to `total` (`total += i`).",
        "Print the total outside the loop.",
      ],
      expected_output: "Total sum: 15",
      reference_solution:
        lang === "Python"
          ? `total = 0\nfor i in range(1, 6):\n    total += i\nprint("Total sum:", total)`
          : `let total = 0;\nfor (let i = 1; i <= 5; i++) {\n  total += i;\n}\nconsole.log("Total sum:", total);`,
    },
    {
      level: 3,
      level_name: "Level 3 — Intermediate",
      title: "Concept Combination: Filter and Aggregate",
      description: `Write a program in ${lang} that loops through numbers from 1 to 20, and only calculates the sum of numbers that are divisible by 3.`,
      hints: [
        "Combine a loop with an `if` condition checking `i % 3 == 0`.",
        "Keep track of the running sum in a variable.",
      ],
      expected_output: "Sum: 63",
      reference_solution:
        lang === "Python"
          ? `sum_div_3 = 0\nfor i in range(1, 21):\n    if i % 3 == 0:\n        sum_div_3 += i\nprint("Sum of multiples of 3:", sum_div_3)`
          : `let sum = 0;\nfor (let i = 1; i <= 20; i++) {\n  if (i % 3 === 0) {\n    sum += i;\n  }\n}\nconsole.log("Sum:", sum);`,
    },
  ];
}

export function explainSingleLine(
  rawLine: string,
  lineNum: number,
  language: string
): {
  line: number;
  code: string;
  explanation: string;
  why: string;
  important_concept?: string;
} {
  const l = rawLine.trim();
  const lower = l.toLowerCase();

  if (!l) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Empty line used for visual spacing and readability.",
      why: "Separates logical sections of code to make it easier for human developers to read.",
    };
  }

  // Comments
  if (l.startsWith("#") || l.startsWith("//") || l.startsWith("/*") || l.startsWith("--")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: `Comment note: "${l.replace(/^[#\/\-\*\s]+/, "")}". Ignored during program execution.`,
      why: "Provides explanatory context and documentation for programmers without affecting runtime behavior.",
      important_concept: "Code Comment / Documentation",
    };
  }

  // User input and type conversion
  if (lower.includes("name = input(") || (lower.includes("input(") && lower.includes("name"))) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Prompts the user to enter their name in the terminal and stores the resulting string in variable 'name'.",
      why: "Allows dynamic runtime interaction by capturing keyboard input from the user.",
      important_concept: "Standard User Input (String)",
    };
  }
  if (lower.includes("int(input(") || (lower.includes("input(") && lower.includes("age"))) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Prompts for the user's age as text and converts (casts) it into an integer with int() before storing in 'age'.",
      why: "Input from the terminal is always a string. Numerical comparison (>= 18) requires converting the string into an integer.",
      important_concept: "Type Casting (str to int)",
    };
  }

  // Imports / Includes
  if (lower.includes("import pandas") || lower.includes("from pandas")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Imports the pandas data analysis library under the common alias 'pd'.",
      why: "Provides fast DataFrames, Series, and data manipulation tools needed for machine learning pipelines.",
      important_concept: "Library Import (DataFrames)",
    };
  }
  if (lower.includes("matplotlib.pyplot") || lower.includes("import matplotlib")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Imports matplotlib's pyplot module under alias 'plt' for data visualization.",
      why: "Allows plotting scatter charts, regression trendlines, and diagnostic graphs.",
      important_concept: "Visualization Module",
    };
  }
  if (lower.includes("sklearn") || lower.includes("linearregression")) {
    if (lower.includes("from sklearn") || lower.includes("import linearregression")) {
      return {
        line: lineNum,
        code: rawLine,
        explanation: "Imports the LinearRegression estimator class from the scikit-learn machine learning library.",
        why: "Provides the mathematical Ordinary Least Squares regression algorithm for fitting and predicting continuous data.",
        important_concept: "ML Algorithm Import",
      };
    }
    if (lower.includes("model =") || lower.includes("linearregression()")) {
      return {
        line: lineNum,
        code: rawLine,
        explanation: "Instantiates a new LinearRegression machine learning model object into variable 'model'.",
        why: "Creates an unfitted estimator instance ready to learn parameters from feature and target data.",
        important_concept: "Model Instantiation",
      };
    }
  }

  // Specific DataFrame and ML assignments
  if (lower.includes("data =") || (lower.includes("{") && (lower.includes("hours") || lower.includes("marks")))) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Defines a Python dictionary containing paired lists of input feature values (Hours) and output observations (Marks).",
      why: "Structures the raw observation data in memory before constructing a tabular DataFrame.",
      important_concept: "Dictionary Data Structure",
    };
  }
  if (lower.includes("pd.dataframe(")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Constructs a 2-dimensional tabular pandas DataFrame 'df' with named columns from the dictionary.",
      why: "DataFrames provide vectorized operations, slicing, indexing, and tabular data management for ML workflows.",
      important_concept: "DataFrame Construction",
    };
  }
  if (lower.includes('x =') || lower.includes("x=") || lower.includes('df[["')) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Extracts the feature column 'Hours' as a 2D DataFrame matrix 'x' (independent variable).",
      why: "Machine learning estimators in scikit-learn require features to be formatted as a 2D matrix (samples × features).",
      important_concept: "Feature Matrix (Independent Variable X)",
    };
  }
  if (lower.includes('y =') || lower.includes("y=") || (lower.includes('df["marks"]') && !lower.includes("predicted"))) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Extracts the target variable 'Marks' as a 1D Series 'y' (dependent variable).",
      why: "The target vector contains the actual ground-truth values that the model attempts to learn and predict.",
      important_concept: "Target Vector (Dependent Variable y)",
    };
  }
  if (lower.includes("model.fit(") || lower.includes(".fit(")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Trains the model using feature matrix 'x' and target vector 'y' to find the best-fit line (y = mx + c).",
      why: "The fitting process calculates the optimal slope (coefficient) and intercept that minimize mean squared error.",
      important_concept: "Model Training (Fitting)",
    };
  }
  if (lower.includes("model.predict(") || lower.includes(".predict(")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Generates predicted mark values for the input study hours 'x' and saves them in a new column 'Predicted_Marks'.",
      why: "Allows evaluating and comparing model predictions directly against the actual ground-truth values in the DataFrame.",
      important_concept: "Model Inference (Prediction)",
    };
  }

  // Model statistics / inspection
  if (lower.includes("model.intercept_") || lower.includes("intercept")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Retrieves and prints the learned intercept (c), the expected mark when study hours equal 0.",
      why: "Represents the starting baseline value of the linear regression equation.",
      important_concept: "Model Intercept Parameter",
    };
  }
  if (lower.includes("model.coef_") || lower.includes("slope")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Retrieves and prints the learned slope coefficient (m), the rate of change in marks per unit hour.",
      why: "Shows the sensitivity and strength of the relationship between study hours and exam scores.",
      important_concept: "Slope / Weight Coefficient",
    };
  }
  if (lower.includes("model.score(") || lower.includes("r²") || lower.includes("r2") || lower.includes("score")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Computes and prints the R² (coefficient of determination) goodness-of-fit score.",
      why: "Measures what percentage of total variance in exam marks is successfully explained by the regression model.",
      important_concept: "R² Evaluation Metric",
    };
  }
  if (lower.includes("plt.scatter(") || lower.includes("scatter")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Generates a 2D scatter plot placing observed study hours on the x-axis and actual marks on the y-axis.",
      why: "Visualizes raw data distribution to verify if a linear trend is appropriate.",
      important_concept: "Scatter Plot Visualization",
    };
  }
  if (lower.includes("plt.plot(") || lower.includes("plot(")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Draws the continuous linear regression line using input hours 'x' and 'Predicted_Marks'.",
      why: "Visualizes the model's fitted equation directly across the plotted data points.",
      important_concept: "Regression Line Plot",
    };
  }
  if (lower.includes("plt.show(")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: "Opens and renders the complete graphical visualization window containing the scatter and line plots.",
      why: "Displays the final chart figure to the user.",
      important_concept: "Render Plot Window",
    };
  }

  // Print statements
  if (lower.includes("print(") || lower.includes("console.log(") || lower.includes("printf(") || lower.includes("cout <<") || lower.includes("system.out")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: `Outputs formatted values or results (${l}) to the standard output console.`,
      why: "Enables developers and users to view calculation results, metrics, and variables.",
      important_concept: "Console Output",
    };
  }

  // Loops
  if (lower.includes("for ") || lower.includes("while ")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: `Initializes an iterative loop statement (${l}) to repeat a code block.`,
      why: "Automates repetitive tasks and processes sequential items one by one.",
      important_concept: "Loop Control Flow",
    };
  }

  // Functions / Methods
  if (lower.includes("def ") || lower.includes("function ") || lower.includes("void ") || lower.includes("public static void")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: `Declares a reusable function or method (${l}).`,
      why: "Organizes code into modular, isolated, and testable blocks.",
      important_concept: "Function Definition",
    };
  }

  // Conditions
  if (lower.includes("if ") || lower.includes("else:") || lower.includes("else if") || lower.includes("elif ")) {
    return {
      line: lineNum,
      code: rawLine,
      explanation: `Evaluates conditional test (${l}) to decide execution branch.`,
      why: "Allows the program to respond dynamically based on variable values and conditions.",
      important_concept: "Conditional Logic",
    };
  }

  // Variable assignment
  if (l.includes("=") && !l.includes("==")) {
    const parts = l.split("=");
    const varName = parts[0].trim();
    return {
      line: lineNum,
      code: rawLine,
      explanation: `Stores calculated value or object in variable '${varName}'.`,
      why: "Saves state in memory so it can be referenced and modified in later instructions.",
      important_concept: "Variable Assignment",
    };
  }

  return {
    line: lineNum,
    code: rawLine,
    explanation: `Executes instruction on line ${lineNum}: "${l}".`,
    why: "Forms part of the sequential program execution logic.",
    important_concept: "Program Statement",
  };
}


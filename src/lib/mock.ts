import { PeerId } from "./types";


interface TopicContent {
  keywords: string[];
  name: string;
  directExplanation: string;
  explorer: string[];
  challenger: string[];
  critic: string[];
  mentor: [string, string, string]; // Hint levels 1, 2, 3
  devils_advocate: string[];
}

const TOPIC_KNOWLEDGE: TopicContent[] = [
  {
    name: "Recursion",
    keywords: ["recursion", "recursive", "base case", "call stack", "recursive function"],
    directExplanation:
      "**Recursion** is a programming technique where a function solves a problem by calling a smaller copy of itself. Every recursive solution requires two critical parts:\n\n1. **Base Case**: The stopping condition that prevents infinite looping (e.g., `if (n <= 1) return 1`).\n2. **Recursive Step**: Breaking the problem into a smaller subproblem (e.g., `return n * factorial(n - 1)`).\n\nThink of Russian nesting dolls — you keep opening smaller dolls until you hit the smallest solid wooden doll (the base case), then close them back up.",
    explorer: [
      "**Recursion** is when a function solves a big problem by delegating smaller copies of the same task to itself — just like Russian nesting dolls! You keep opening smaller dolls until you reach the solid one in the center (the *base case*). If you were writing a countdown from 5 to 1, what do you think the function should do when it hits 1?",
      "Think of recursion like standing between two mirrors: the reflections go on forever unless something stops them. In code, that stopper is called the **base case**. What would happen to your computer if a recursive function forgot its base case?",
      "A great mental model for recursion is delegating: if you need to count 100 people in a line, you just ask the person in front of you 'what is your number + 1?' and they ask the next person until someone hits person #1! How does that feel compared to a regular loop?",
    ],
    challenger: [
      "Now that we know recursion breaks tasks into smaller sub-problems: when would you choose recursion over a simple `for` or `while` loop, and what's the memory cost of each recursive call?",
      "Every recursive call creates a new frame on the call stack. What happens if the input is 1,000,000 deep? Is recursion always the most practical solution?",
      "You understand the base case, but what about the return flow? When a base case is reached, how do the returned values bubble back up through the stack?",
    ],
    critic: [
      "Here's the most common trap with recursion: **Stack Overflow**. If your base case condition isn't reached (e.g. subtracting 2 when input is odd, or forgetting negative numbers), the call stack runs out of memory. How would you test your base case for edge inputs?",
      "Look closely at the state being passed: if a recursive call modifies a shared object without passing new arguments, it can cause unexpected mutations. Always check if each recursive call receives an independent, smaller sub-problem.",
      "Check your return types: in recursive branches, forgetting to `return` the recursive call (e.g., just writing `solve(n-1)` instead of `return solve(n-1)`) will return `undefined` back up the chain.",
    ],
    mentor: [
      "**Hint 1 (Big Picture):** Focus on the simplest possible input first (the base case). For a factorial or countdown, what is the answer when `n = 1` or `n = 0`?",
      "**Hint 2 (Mechanism):** Once the base case is defined with `if (n <= 1) return 1`, write the recursive step by assuming the function already works for `n - 1`, so your result is `n * solve(n - 1)`.",
      "**Hint 3 (Worked Pattern):**\n```js\nfunction countdown(n) {\n  if (n <= 0) return; // 1. Base case\n  console.log(n);\n  countdown(n - 1);   // 2. Recursive call on smaller problem\n}\n```\nNotice how `n - 1` shrinks toward `0` with every single step!",
    ],
    devils_advocate: [
      "Every single recursive problem can also be written using an iterative loop (`while`/`for`) with an explicit stack, using $O(1)$ stack frame overhead. Why would we ever use recursion if iteration uses less memory?",
      "In languages without tail-call optimization, recursion is often slower and risks crashing on large inputs. Isn't a standard loop almost always safer in production systems?",
      "People say recursion makes code 'cleaner', but for many teams it is harder to read, debug, and trace than a straightforward loop. Where is the line between elegant code and readable code?",
    ],
  },
  {
    name: "Stacks & LIFO",
    keywords: ["stack", "lifo", "last in first out", "push", "pop", "call stack"],
    directExplanation:
      "A **Stack** is a linear data structure that adheres to the **LIFO (Last-In, First-Out)** principle. The last item added (*pushed*) is the first item removed (*popped*).\n\n- **Push**: Add item to top ($O(1)$)\n- **Pop**: Remove item from top ($O(1)$)\n- **Peek**: View top item ($O(1)$)\n\nCommon real-world uses: Browser 'Back' button history, text editor 'Undo' (`Ctrl+Z`), and function call tracking in programming languages.",
    explorer: [
      "A **Stack** works on **LIFO (Last-In, First-Out)** — exactly like a stack of plates in a cafeteria: the last plate you place on top is the very first one someone picks up! In software, why do you think a text editor's 'Undo' (`Ctrl+Z`) feature is built using a stack?",
      "Think about your web browser's Back button. Every time you click a new link, that URL is *pushed* on top of your history stack. When you hit Back, the top page is *popped*. What would happen if a browser used First-In, First-Out instead?",
      "Stacks have only two main operations: `push` (put on top) and `pop` (take off top), both taking instant $O(1)$ time. Where else in your daily life do you see LIFO behavior?",
    ],
    challenger: [
      "Stacks give $O(1)$ access only to the very top element. What if you need to search for an item buried in the middle or bottom of a stack? What is the time complexity then?",
      "If you implement a stack with a dynamic array vs a linked list, what are the trade-offs in terms of memory cache locality and resizing costs?",
      "What is the difference between the Call Stack (execution frames) and the Heap (dynamic object storage) in memory?",
    ],
    critic: [
      "Watch out for **Stack Underflow** — attempting to `pop()` or `peek()` from an empty stack will throw an error or return `null/undefined`. Always check `isEmpty()` before popping.",
      "Another critical edge case is bounded memory: if you keep pushing items without popping (like an infinite recursive loop), you cause a Stack Overflow.",
      "When using an array to back a stack, popping the start with `shift()` is $O(N)$, whereas popping the end with `pop()` is $O(1)$. Make sure the top of your stack is at the array's end!",
    ],
    mentor: [
      "**Hint 1:** Visualize a tube closed at one end. Items go in top-first and come out top-first.",
      "**Hint 2:** The core operations are `push(item)` to add, `pop()` to remove and return the top item, and `peek()` to look without removing.",
      "**Hint 3:** In JavaScript/Python: `const stack = []; stack.push('A'); stack.push('B'); console.log(stack.pop()); // prints 'B'`",
    ],
    devils_advocate: [
      "If a Stack only allows access to the top element, isn't it just a strictly worse array with artificial limitations? Why not just use a full array everywhere?",
      "Many modern algorithms use double-ended queues (Deques) because they provide both Stack and Queue capabilities simultaneously. Is a standalone Stack still necessary?",
      "In concurrent multi-threaded environments, lock-free stacks are notoriously hard to synchronize safely without contention bottlenecks. How does that impact high-throughput systems?",
    ],
  },
  {
    name: "Time Complexity & Big-O",
    keywords: ["time complexity", "big o", "big-o", "o(n)", "o(1)", "o(n^2)", "space complexity", "asymptotic"],
    directExplanation:
      "**Time Complexity (Big-O notation)** describes how an algorithm's execution time grows as the input size ($N$) scales to infinity.\n\nKey Big-O classes from fastest to slowest:\n- $O(1)$ **Constant**: Instant hash lookup, array index access.\n- $O(\\log N)$ **Logarithmic**: Binary search on sorted data.\n- $O(N)$ **Linear**: Single loop through an array.\n- $O(N \\log N)$ **Linearithmic**: MergeSort, QuickSort.\n- $O(N^2)$ **Quadratic**: Nested loops (e.g. checking every pair).\n- $O(2^N)$ **Exponential**: Brute-force subsets, recursive Fibonacci.",
    explorer: [
      "**Time Complexity (Big-O)** is NOT about counting clock seconds — it's about asking: *'As my input data grows from 10 to 1,000,000 items, how does the number of computational steps explode?'* For instance, looking up an index in an array is instant ($O(1)$), but scanning an unsorted list takes $O(N)$. If you double the data in an $O(N^2)$ algorithm, how many more steps does it take?",
      "Imagine finding a word in a dictionary: scanning page by page from the start is $O(N)$, but opening to the middle and cutting in half each time is $O(\\log N)$. Which approach scales better if the dictionary has 10 million pages?",
      "Big-O measures the growth curve in the worst-case scenario. Why do software engineers care more about the growth curve than raw hardware speed?",
    ],
    challenger: [
      "An algorithm with $O(N)$ with a constant factor of $1,000,000 \\cdot N$ might be slower for small inputs than an $O(N^2)$ algorithm. At what point does Big-O asymptotic analysis actually matter?",
      "What is the difference between Worst-Case $O$, Average-Case $\\Theta$, and Best-Case $\\Omega$ notation?",
      "Why is Space Complexity just as critical as Time Complexity in distributed or embedded systems?",
    ],
    critic: [
      "A classic misconception: doing two separate sequential loops (`for ...` followed by `for ...`) is $O(N + N) = O(N)$, NOT $O(N^2)$. Nested loops (`for` inside `for`) are what produce $O(N^2)$.",
      "Don't ignore hidden library method costs! For example, calling `array.includes()` or `array.indexOf()` inside a loop turns an $O(N)$ loop into $O(N^2)$ under the hood.",
      "Constant factors and lower-order terms are dropped in Big-O notation: $O(5N^2 + 100N + 50)$ simplifies strictly to $O(N^2)$ as $N \\to \\infty$.",
    ],
    mentor: [
      "**Hint 1:** Count the nested loops that depend on input size $N$. 1 loop $\\to O(N)$, 2 nested loops $\\to O(N^2)$.",
      "**Hint 2:** If you divide the problem space in half on every single step (like Binary Search), that is $O(\\log N)$.",
      "**Hint 3:** Key cheat sheet: Array index = $O(1)$, Linear search = $O(N)$, Binary search = $O(\\log N)$, Nested loops = $O(N^2)$, Efficient sorting = $O(N \\log N)$.",
    ],
    devils_advocate: [
      "In the real world with modern CPU cache lines, sequential $O(N)$ memory scans often beat $O(\\log N)$ pointer-chasing trees for small-to-medium $N$. Isn't theoretical Big-O overemphasized at the expense of hardware reality?",
      "Premature optimization for Big-O often makes code unreadable and bug-prone. Shouldn't developers write clean $O(N^2)$ code first and only optimize if profiling proves it's a bottleneck?",
      "Is $O(1)$ hash map lookup always better than $O(N)$ search if hash collision resolution or hashing overhead dominates for small collections?",
    ],
  },
  {
    name: "Arrays vs Linked Lists",
    keywords: ["array", "linked list", "arrays vs linked lists", "contiguous memory", "node", "pointer"],
    directExplanation:
      "**Arrays vs Linked Lists** represent the fundamental trade-off between contiguous memory and pointer-linked nodes:\n\n| Feature | Array | Linked List |\n|---|---|---|\n| **Memory** | Contiguous block | Scattered nodes with pointers |\n| **Access by index** | $O(1)$ instant | $O(N)$ linear traversal |\n| **Insertion/Deletion at start** | $O(N)$ (requires shifting) | $O(1)$ (change head pointer) |\n| **Insertion/Deletion in middle** | $O(N)$ | $O(1)$ (if pointer is already at node) |\n| **Cache performance** | Excellent (spatial locality) | Poor (pointer jumping) |",
    explorer: [
      "Great question! An **Array** is like a row of reserved parking spots: each item has a numbered spot (index), so jumping to index #42 is instant ($O(1)$). A **Linked List** is like a treasure hunt: each clue (node) tells you where the next clue is located. If you were building a music playlist where songs are constantly inserted and reordered, which one would you choose?",
      "In an Array, adding or removing an item at the beginning requires shifting all other elements one spot over ($O(N)$). In a Linked List, you just change the head pointer ($O(1)$). But finding the 50th item in a Linked List requires walking 50 pointers! How does that trade-off shape your system design?",
      "Arrays need a single contiguous chunk of memory, whereas Linked Lists can allocate small pieces of memory anywhere they fit. How might this affect memory fragmentation in large systems?",
    ],
    challenger: [
      "Modern CPU caches love contiguous memory (spatial prefetching). Even though Linked Lists have $O(1)$ pointer insertion, why are Arrays and Dynamic Vectors often faster in real-world benchmarks?",
      "How does a Singly Linked List compare with a Doubly Linked List in terms of memory overhead and traversal flexibility?",
      "If you need to implement a Queue (First-In, First-Out), would you use an Array or a Linked List, and why?",
    ],
    critic: [
      "Common bug in Linked Lists: losing reference to the rest of the list when updating pointers. Always preserve `node.next` before overwriting it during an insertion or reversal!",
      "Arrays have fixed capacity in low-level memory; dynamic arrays (like `std::vector` or JS arrays) resize by allocating a 2x larger block and copying everything over when full (amortized $O(1)$).",
      "Off-by-one errors are frequent when checking end-of-list conditions (`curr !== null` vs `curr.next !== null`). Ensure your loop termination matches your intent.",
    ],
    mentor: [
      "**Hint 1:** If you need frequent random lookups by index (`arr[i]`), pick an **Array** ($O(1)$).",
      "**Hint 2:** If you do frequent insertions and deletions at the front without needing random index access, a **Linked List** ($O(1)$) shines.",
      "**Hint 3:** A linked list node consists of `value` and `next`: `{ val: 10, next: { val: 20, next: null } }`. To insert, you only update the `.next` references!",
    ],
    devils_advocate: [
      "With modern memory architectures, the pointer overhead (8 bytes per node on 64-bit) and cache-miss penalty make Linked Lists almost obsolete for general application programming. Why shouldn't we just default to Dynamic Arrays for almost everything?",
      "Arrays support cache prefetching and SIMD vectorization, which linked nodes cannot do. Isn't a Linked List purely an academic interview concept in 2026?",
      "If insertion in an array is $O(N)$ due to memory copying, but modern CPUs can copy gigabytes per second with `memcpy`, is the algorithmic advantage of linked lists negligible in practice for arrays under 10,000 items?",
    ],
  },
  {
    name: "Binary Search",
    keywords: ["binary search", "bsearch", "divide and conquer", "sorted array"],
    directExplanation:
      "**Binary Search** is an efficient $O(\\log N)$ algorithm for finding an element in a **sorted** array. It repeatedly divides the search interval in half:\n\n1. Look at the middle element `mid = Math.floor((low + high) / 2)`.\n2. If `target === arr[mid]`, found!\n3. If `target < arr[mid]`, narrow search to the left half (`high = mid - 1`).\n4. If `target > arr[mid]`, narrow search to the right half (`low = mid + 1`).\n\nIn an array of 1,000,000 elements, Binary Search needs at most **20 comparisons** ($\log_2 10^6 \\approx 20$)!",
    explorer: [
      "**Binary Search** is like guessing a secret number between 1 and 100: if you guess 50 and are told 'Higher', you instantly eliminate half the possibilities (1 to 50)! In a sorted array of 1,000,000 items, binary search finds any item in just **20 steps** ($O(\\log N)$). What is the one strict requirement for Binary Search to work?",
      "Think about dividing a phone book in half with each page turn. Why is this exponentially faster than turning pages one by one ($O(N)$)?",
      "If you double the number of items in a sorted list from 1,000 to 2,000, how many extra comparisons does Binary Search need?",
    ],
    challenger: [
      "Binary Search requires the data to be sorted. If your dataset is constantly changing with frequent inserts, does the cost of maintaining sorted order outweigh the search speedup?",
      "How would you modify Binary Search to find the *first occurrence* or *last occurrence* of a duplicate element?",
      "Can you apply Binary Search on non-array problems (e.g. searching on an answer space, like finding the minimum speed required to arrive on time)?",
    ],
    critic: [
      "Classic integer overflow bug: computing `mid = (low + high) / 2` can overflow in languages with 32-bit signed integers when `low + high > 2^31 - 1`. Safer pattern: `mid = low + Math.floor((high - low) / 2)`.",
      "Infinite loop bug: make sure you update `low = mid + 1` and `high = mid - 1`, not `low = mid` or `high = mid`, or the loop condition `low <= high` can get stuck forever.",
      "Always check your boundary condition: is it `low <= high` or `low < high`? For standard search, `low <= high` ensures the single-element case is checked.",
    ],
    mentor: [
      "**Hint 1:** Maintain two pointers: `low = 0` and `high = arr.length - 1`.",
      "**Hint 2:** In a `while (low <= high)` loop, calculate `mid` and compare `arr[mid]` with your target.",
      "**Hint 3 (Code Structure):**\n```js\nwhile (low <= high) {\n  const mid = low + Math.floor((high - low) / 2);\n  if (arr[mid] === target) return mid;\n  if (arr[mid] < target) low = mid + 1;\n  else high = mid - 1;\n}\nreturn -1;\n```",
    ],
    devils_advocate: [
      "If you only search a dataset once or twice, sorting it first ($O(N \\log N)$) plus Binary Search ($O(\\log N)$) is actually slower than just doing a single linear search ($O(N)$). When is Binary Search actually worth it?",
      "Hash maps provide $O(1)$ average search time. Why use Binary Search on a sorted array when a Hash Table can find items in constant time?",
      "Binary Search has worse cache spatial locality during initial steps because it jumps across large memory regions. Does linear search win for small arrays ($N < 64$)?",
    ],
  },
  {
    name: "Dynamic Programming",
    keywords: ["dynamic programming", "dp", "memoization", "tabulation", "overlapping subproblems", "optimal substructure"],
    directExplanation:
      "**Dynamic Programming (DP)** is an optimization technique that solves complex problems by breaking them down into simpler subproblems, solving each subproblem once, and storing the results to avoid redundant work.\n\nTwo core prerequisites:\n1. **Overlapping Subproblems**: The same subproblems are called repeatedly (e.g. recursive Fibonacci).\n2. **Optimal Substructure**: The optimal solution to the problem contains optimal solutions to its subproblems.\n\nTwo approaches: **Memoization** (Top-Down with recursion + cache) and **Tabulation** (Bottom-Up with a table/array).",
    explorer: [
      "**Dynamic Programming (DP)** is basically *'remembering the past so you don't repeat work'*. If I write `1 + 1 + 1 + 1 = 4` on a board and then add another `+ 1`, you immediately know the answer is 5 because you remembered the 4! In code, saving sub-results into a cache is called **Memoization**. How does this transform recursive Fibonacci from exponential $O(2^N)$ to lightning-fast $O(N)$?",
      "Think of DP as filling in a table of answers from smallest to largest (**Tabulation**). What's the advantage of building answers bottom-up versus top-down recursion?",
      "When you climb stairs 1 or 2 steps at a time, the number of ways to reach step $N$ is just ways to reach $(N-1)$ + ways to reach $(N-2)$. Where else do you see this overlapping pattern?",
    ],
    challenger: [
      "How do you distinguish between problems that can be solved with a simple **Greedy** choice versus those that strictly require **Dynamic Programming**?",
      "What is the space-time trade-off when optimizing a 2D DP table down to a 1D rolling array?",
      "How do you construct the recurrence relation when starting a brand new DP problem from scratch?",
    ],
    critic: [
      "Don't confuse state parameters: make sure your memoization cache key uniquely captures ALL variables that influence the subproblem's outcome.",
      "Base cases in DP tables must be initialized accurately before running the loop, or incorrect initial values will propagate across the entire table.",
      "Watch out for memory limits when using multidimensional tables ($O(N \\cdot W)$ or $O(N^3)$). Look for opportunities to keep only the previous row/state.",
    ],
    mentor: [
      "**Hint 1:** Start by writing the brute-force recursive solution first.",
      "**Hint 2:** Add a hash map or array `memo` to store `memo[n] = result` before returning.",
      "**Hint 3:** Transition to bottom-up: `dp[0] = 0; dp[1] = 1; for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];`",
    ],
    devils_advocate: [
      "Many DP problems can be solved more intuitively with memoized recursion than complex bottom-up tabulation matrices. Why do interviewers obsess over tabulation?",
      "DP uses extra memory ($O(N)$ or $O(N^2)$ space) which can cause memory pressure in embedded systems. Are greedy approximations often good enough in practice?",
      "Is Dynamic Programming over-represented in software interviews relative to how often it is actually written in production application code?",
    ],
  },
];

function findMatchingTopic(input: string, topicHint?: string | null): TopicContent | null {
  const normalized = `${input} ${topicHint || ""}`.toLowerCase();
  for (const topic of TOPIC_KNOWLEDGE) {
    if (topic.keywords.some((kw) => normalized.includes(kw))) {
      return topic;
    }
  }
  return null;
}

let counter = 0;

export function mockPeerReply(
  peer: PeerId,
  studentMessage: string = "",
  history: { role: string; text: string }[] = [],
  topicHint?: string | null,
  hintLevel: 1 | 2 | 3 = 1,
  isDirect: boolean = false
): string {
  const match = findMatchingTopic(studentMessage, topicHint);
  const msgLower = studentMessage.toLowerCase();
  const asksForDirect =
    isDirect ||
    msgLower.includes("explain") ||
    msgLower.includes("what is") ||
    msgLower.includes("how does") ||
    msgLower.includes("tell me") ||
    msgLower.includes("direct answer") ||
    msgLower.includes("can you explain");

  if (match) {
    if (asksForDirect && (peer === "explorer" || peer === "mentor")) {
      return match.directExplanation;
    }

    if (peer === "mentor") {
      const hintIdx = (hintLevel - 1) as 0 | 1 | 2;
      return match.mentor[hintIdx] || match.mentor[0];
    }

    const lines = match[peer];
    if (lines && lines.length > 0) {
      const line = lines[counter % lines.length];
      counter += 1;
      return line;
    }
  }

  // Generic dynamic fallback for any custom topic / question
  const topicName = extractSubject(studentMessage, topicHint);

  switch (peer) {
    case "explorer":
      if (asksForDirect) {
        return `**${topicName}** is an important concept in computer science and problem-solving! At its core, it provides a structured way to handle data, logic, or system behavior efficiently. Think of it as a specialized tool in your engineering toolkit designed to solve specific types of challenges cleanly.\n\nWhat particular aspect or example of **${topicName}** would you like to break down first?`;
      }
      return `Let's explore **${topicName}** together! Think of it from first principles: what is the fundamental problem or goal that **${topicName}** is designed to solve? How would you describe it in your own words?`;

    case "challenger":
      return `Looking at **${topicName}**, what are the key trade-offs or assumptions involved? If you had to compare this approach to an alternative, what makes **${topicName}** the better choice here?`;

    case "critic":
      return `When working with **${topicName}**, what are the edge cases, boundaries, or failure modes that could break your logic? How would you guard your implementation against them?`;

    case "mentor":
      if (hintLevel === 1) {
        return `**Mentor Nudge:** For **${topicName}**, start with the smallest, simplest possible example. Once you solve that base case, expanding to larger inputs becomes much clearer.`;
      } else if (hintLevel === 2) {
        return `**Mentor Step:** Break **${topicName}** down into two phases: the input/initialization phase, and the transformation or stopping condition. Which part feels least clear right now?`;
      } else {
        return `**Mentor Breakdown:** Let's trace **${topicName}** step-by-step with a concrete input. Write out what happens on step 1, step 2, and what signals the final output!`;
      }

    case "devils_advocate":
      return `Here's a thought-provoking counterpoint on **${topicName}**: is there a simpler or more direct way to solve this without the added abstraction? When might using **${topicName}** be overkill?`;

    default:
      return `Let's dive into **${topicName}** step by step. What do you think is the main intuition behind it?`;
  }
}

function extractSubject(message: string, fallbackTopic?: string | null): string {
  if (fallbackTopic && fallbackTopic.trim()) return fallbackTopic.trim();
  const clean = message.replace(/^[iI] (don't|dont|do not) (understand|get|know)\s*/i, "")
    .replace(/^what is (a |an |the )?/i, "")
    .replace(/^why (does |is |do )?/i, "")
    .replace(/^how (does |do |to )?/i, "")
    .replace(/^can you explain /i, "")
    .replace(/\?+$/, "")
    .trim();
  return clean || "this concept";
}

export function mockMistakeAnalysis(topic: string) {
  const match = findMatchingTopic(topic);
  if (match) {
    return {
      understood: `You understand the high-level purpose of ${match.name} and why it is useful in software design.`,
      wentWrong:
        "The reasoning skips the explicit boundary condition (like base case, empty input, or stopping rule).",
      misconception:
        `It is easy to assume ${match.name} handles termination or state changes automatically rather than through explicit conditional checks.`,
      smallerQuestion:
        `What is the smallest possible input for ${match.name} where the answer is immediately obvious without any computation?`,
    };
  }
  return {
    understood: `You have a solid grip on the foundational goal behind ${topic}.`,
    wentWrong:
      "The reasoning glosses over the exact transition step or boundary condition.",
    misconception:
      "Assuming the mechanism resolves intermediate states implicitly.",
    smallerQuestion:
      "Try tracing the smallest single-element case from start to finish.",
  };
}

export function mockDebate(topic: string) {
  const match = findMatchingTopic(topic);
  if (match) {
    return {
      viewpointA: {
        persona: "explorer" as const,
        argument: `For ${match.name}, this approach offers the cleanest mental model and optimal runtime performance under standard operating constraints.`,
      },
      viewpointB: {
        persona: "challenger" as const,
        argument: `However, under high concurrency, memory constraints, or edge-case workloads, the alternate design prevents memory bloat and catastrophic bottlenecks in ${match.name}.`,
      },
    };
  }
  return {
    viewpointA: {
      persona: "explorer" as const,
      argument: `There is a compelling practical case for "${topic}" — it optimizes for simplicity, developer ergonomics, and the common case.`,
    },
    viewpointB: {
      persona: "challenger" as const,
      argument: `That assumption breaks down when scale or memory constraints change — under different system requirements, the trade-offs in "${topic}" flip completely.`,
    },
  };
}

export function mockDebateEvaluation() {
  return {
    verdict: "strong",
    strengthScore: 85,
    feedback:
      "You clearly evaluated the structural trade-offs rather than relying on gut feel. Backing up your choice with a concrete example made your reasoning convincing!",
  };
}

export function mockTeachFollowup() {
  const followups = [
    "That makes sense! And what is the exact stopping or boundary condition that tells it when to finish?",
    "Got it — how would this behave if we gave it an empty or single-element input?",
    "Nice explanation! Could you give a quick real-world analogy to solidify the intuition?",
  ];
  return {
    reply: followups[counter % followups.length],
    done: counter % 3 === 2,
  };
}

export function mockTeachEvaluation() {
  return {
    conceptAccuracy: 88,
    clarity: 84,
    missingDetails: "You covered the mechanism and intuition well! Adding an explicit edge-case condition completes the picture.",
    exampleGiven: true,
    summary:
      "Your explanation was clear, structured, and pedagogical. You clearly understand how the components connect!",
  };
}

export function mockNoAiEvaluation(problem: string = "", studentSolution: string = "") {
  const clean = studentSolution.trim().toLowerCase();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  // Very short, empty or meaningless response
  if (wordCount < 4 || clean.length < 15) {
    return {
      independentReasoning: 25,
      conceptUnderstanding: 30,
      selfCorrection: 20,
      feedback:
        "Your response is too brief to show how you worked through the problem. Try explaining the underlying step-by-step mechanism and why it behaves that way.",
    };
  }

  // Check for relevant CS reasoning keywords
  const csKeywords = [
    "cache", "contiguous", "pointer", "spatial", "locality", "prefetch", "memory",
    "stack", "frame", "overflow", "recursion", "base case", "binary", "halving", "log",
    "hash", "collision", "overhead", "tradeoff", "complexity", "constant", "linear",
    "index", "array", "list", "ram", "cpu", "bottleneck"
  ];

  const matchedKeywords = csKeywords.filter((kw) => clean.includes(kw));

  if (matchedKeywords.length >= 3 || (wordCount >= 25 && matchedKeywords.length >= 2)) {
    return {
      independentReasoning: Math.min(94, 80 + matchedKeywords.length * 3),
      conceptUnderstanding: Math.min(96, 82 + matchedKeywords.length * 3),
      selfCorrection: 85,
      feedback:
        `Strong reasoning! You accurately focused on key mechanisms (${matchedKeywords.slice(0, 3).join(", ")}) to explain the trade-offs and hardware behavior.`,
    };
  }

  if (matchedKeywords.length >= 1 || wordCount >= 15) {
    return {
      independentReasoning: 65,
      conceptUnderstanding: 60,
      selfCorrection: 55,
      feedback:
        "You have a good initial intuition, but the explanation would be stronger by addressing the exact physical mechanics (such as cache lines or memory access patterns).",
    };
  }

  return {
    independentReasoning: 40,
    conceptUnderstanding: 35,
    selfCorrection: 30,
    feedback:
      "Your explanation needs to address the specific technical mechanics of the problem. Consider how memory layout and CPU architecture affect runtime beyond theoretical Big-O.",
  };
}

export function mockExplain(style: string, doubt: string) {
  const match = findMatchingTopic(doubt);
  const conceptName = match ? match.name : doubt;

  const byStyle: Record<string, string> = {
    simple: `Think of **${conceptName}** like Russian nesting dolls or a stack of cafeteria plates: you process one layer at a time until you reach the base, then assemble the result on the way back out. Simple, elegant, and structured.`,
    example: `Here's a concrete example of **${conceptName}**: if you're calculating a 5-step countdown, step 5 calls step 4, which calls step 3, down to 1. Once 1 is hit, every step completes its job and returns its result back up.`,
    meme: `**${conceptName}** is basically: *"I don't know the full answer, but I know how to do 1 step, so I'll let future-me handle the other 99 steps."* And honestly? It actually works.`,
    story: `A chef is tasked with peeling 100 potatoes for a royal banquet. Instead of panicking, the chef peels 1 potato and hands the basket of 99 to an apprentice. The apprentice does the same until only 1 potato remains. The final potato is peeled, and the job is done! That is **${conceptName}**.`,
    cinema: `The clock is ticking. The vault has 10 security doors. To unlock door 10, agent must retrieve the key from door 9, who must get it from door 8, all the way to the master terminal. Once accessed, the signal cascades back, unlocking all 10 doors in reverse sequence. That's **${conceptName}**, cinematic edit.`,
    tanglish: `**${conceptName}** romba simple da! Oru periya task-ah chinna chinna pieces-ah split panni solve panrom. Base condition reach aana odane, result return aagi full problem solve aayidum! Super clean technique!`,
  };
  return byStyle[style] || byStyle.simple;
}

export function mockInsight(): string {
  return "You have great intuition for identifying the core mechanism of concepts. Practicing edge-case identification and boundary conditions will make your algorithmic reasoning rock-solid!";
}


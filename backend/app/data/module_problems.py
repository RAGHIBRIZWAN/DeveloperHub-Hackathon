"""
MCQ Questions and Coding Problems for PF, OOP, and DSA Modules
==============================================================
Theoretical MCQs and coding problems with varying difficulty levels.
"""

# ==================== PROGRAMMING FUNDAMENTALS ====================

PF_MCQ_QUESTIONS = [
    # Variables & Data Types
    {
        "id": "pf-mcq-001",
        "topic": "Variables & Data Types",
        "difficulty": "easy",
        "question": "What is the correct way to declare an integer variable in Python?",
        "options": [
            {"id": "a", "text": "int x = 5;", "is_correct": False},
            {"id": "b", "text": "x = 5", "is_correct": True},
            {"id": "c", "text": "var x = 5", "is_correct": False},
            {"id": "d", "text": "integer x = 5", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "In Python, variables are dynamically typed. You simply assign a value without declaring the type. 'x = 5' creates an integer variable."
    },
    {
        "id": "pf-mcq-002",
        "topic": "Variables & Data Types",
        "difficulty": "easy",
        "question": "Which of the following is NOT a valid variable name in most programming languages?",
        "options": [
            {"id": "a", "text": "myVariable", "is_correct": False},
            {"id": "b", "text": "_count", "is_correct": False},
            {"id": "c", "text": "2ndNumber", "is_correct": True},
            {"id": "d", "text": "total_sum", "is_correct": False}
        ],
        "correct_option": "c",
        "explanation": "Variable names cannot start with a number in most programming languages. '2ndNumber' is invalid because it starts with '2'."
    },
    {
        "id": "pf-mcq-003",
        "topic": "Variables & Data Types",
        "difficulty": "medium",
        "question": "What is the result of 7 / 2 in Python 3?",
        "options": [
            {"id": "a", "text": "3", "is_correct": False},
            {"id": "b", "text": "3.5", "is_correct": True},
            {"id": "c", "text": "3.0", "is_correct": False},
            {"id": "d", "text": "Error", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "In Python 3, the '/' operator performs true division, returning a float. Use '//' for integer division."
    },
    # Control Flow
    {
        "id": "pf-mcq-004",
        "topic": "Control Flow",
        "difficulty": "easy",
        "question": "What will be printed?\n\nx = 10\nif x > 5:\n    print('A')\nelse:\n    print('B')",
        "options": [
            {"id": "a", "text": "A", "is_correct": True},
            {"id": "b", "text": "B", "is_correct": False},
            {"id": "c", "text": "AB", "is_correct": False},
            {"id": "d", "text": "Nothing", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "Since x=10 which is greater than 5, the condition is true and 'A' is printed."
    },
    {
        "id": "pf-mcq-005",
        "topic": "Control Flow",
        "difficulty": "medium",
        "question": "What is the output of this code?\n\nfor i in range(3):\n    if i == 1:\n        continue\n    print(i, end=' ')",
        "options": [
            {"id": "a", "text": "0 1 2", "is_correct": False},
            {"id": "b", "text": "0 2", "is_correct": True},
            {"id": "c", "text": "1", "is_correct": False},
            {"id": "d", "text": "0 2 3", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The 'continue' statement skips the current iteration when i=1, so only 0 and 2 are printed."
    },
    # Loops
    {
        "id": "pf-mcq-006",
        "topic": "Loops",
        "difficulty": "easy",
        "question": "How many times will this loop execute?\n\nfor i in range(5):\n    print(i)",
        "options": [
            {"id": "a", "text": "4 times", "is_correct": False},
            {"id": "b", "text": "5 times", "is_correct": True},
            {"id": "c", "text": "6 times", "is_correct": False},
            {"id": "d", "text": "Infinite times", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "range(5) generates numbers 0, 1, 2, 3, 4 - a total of 5 iterations."
    },
    {
        "id": "pf-mcq-007",
        "topic": "Loops",
        "difficulty": "medium",
        "question": "What is the output?\n\ni = 0\nwhile i < 3:\n    i += 1\n    if i == 2:\n        break\nprint(i)",
        "options": [
            {"id": "a", "text": "1", "is_correct": False},
            {"id": "b", "text": "2", "is_correct": True},
            {"id": "c", "text": "3", "is_correct": False},
            {"id": "d", "text": "0", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The loop increments i first, then breaks when i equals 2. So i is 2 when printed."
    },
    # Functions
    {
        "id": "pf-mcq-008",
        "topic": "Functions",
        "difficulty": "easy",
        "question": "What keyword is used to define a function in Python?",
        "options": [
            {"id": "a", "text": "function", "is_correct": False},
            {"id": "b", "text": "def", "is_correct": True},
            {"id": "c", "text": "func", "is_correct": False},
            {"id": "d", "text": "define", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "In Python, the 'def' keyword is used to define a function."
    },
    {
        "id": "pf-mcq-009",
        "topic": "Functions",
        "difficulty": "medium",
        "question": "What is the output?\n\ndef greet(name='World'):\n    return f'Hello, {name}!'\n\nprint(greet())",
        "options": [
            {"id": "a", "text": "Hello, !", "is_correct": False},
            {"id": "b", "text": "Hello, World!", "is_correct": True},
            {"id": "c", "text": "Error", "is_correct": False},
            {"id": "d", "text": "Hello, name!", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The function has a default parameter name='World'. When called without arguments, it uses the default value."
    },
    {
        "id": "pf-mcq-010",
        "topic": "Functions",
        "difficulty": "hard",
        "question": "What is a recursive function?",
        "options": [
            {"id": "a", "text": "A function that takes no parameters", "is_correct": False},
            {"id": "b", "text": "A function that calls itself", "is_correct": True},
            {"id": "c", "text": "A function that returns multiple values", "is_correct": False},
            {"id": "d", "text": "A function defined inside another function", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "A recursive function is one that calls itself to solve a problem by breaking it into smaller subproblems."
    },
    # Arrays/Lists
    {
        "id": "pf-mcq-011",
        "topic": "Arrays",
        "difficulty": "easy",
        "question": "What is the index of the first element in a Python list?",
        "options": [
            {"id": "a", "text": "1", "is_correct": False},
            {"id": "b", "text": "0", "is_correct": True},
            {"id": "c", "text": "-1", "is_correct": False},
            {"id": "d", "text": "None", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Python uses 0-based indexing, so the first element is at index 0."
    },
    {
        "id": "pf-mcq-012",
        "topic": "Arrays",
        "difficulty": "medium",
        "question": "What is the output?\n\narr = [1, 2, 3, 4, 5]\nprint(arr[1:4])",
        "options": [
            {"id": "a", "text": "[1, 2, 3, 4]", "is_correct": False},
            {"id": "b", "text": "[2, 3, 4]", "is_correct": True},
            {"id": "c", "text": "[2, 3, 4, 5]", "is_correct": False},
            {"id": "d", "text": "[1, 2, 3]", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Slicing arr[1:4] returns elements from index 1 to 3 (4 is exclusive), which is [2, 3, 4]."
    },
    # Operators
    {
        "id": "pf-mcq-013",
        "topic": "Operators",
        "difficulty": "easy",
        "question": "What is the result of 15 % 4?",
        "options": [
            {"id": "a", "text": "3", "is_correct": True},
            {"id": "b", "text": "3.75", "is_correct": False},
            {"id": "c", "text": "4", "is_correct": False},
            {"id": "d", "text": "1", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "The modulo operator % returns the remainder of division. 15 ÷ 4 = 3 remainder 3."
    },
    {
        "id": "pf-mcq-014",
        "topic": "Operators",
        "difficulty": "medium",
        "question": "What is the result of True and False or True?",
        "options": [
            {"id": "a", "text": "True", "is_correct": True},
            {"id": "b", "text": "False", "is_correct": False},
            {"id": "c", "text": "Error", "is_correct": False},
            {"id": "d", "text": "None", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "Operator precedence: (True and False) = False, then (False or True) = True."
    },
    {
        "id": "pf-mcq-015",
        "topic": "Operators",
        "difficulty": "hard",
        "question": "What is the output of 2 ** 3 ** 2 in Python?",
        "options": [
            {"id": "a", "text": "64", "is_correct": False},
            {"id": "b", "text": "512", "is_correct": True},
            {"id": "c", "text": "256", "is_correct": False},
            {"id": "d", "text": "81", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Exponentiation is right-associative: 2 ** (3 ** 2) = 2 ** 9 = 512."
    }
]

PF_CODING_PROBLEMS = [
    {
        "id": "pf-code-001",
        "name": "Sum of Two Numbers",
        "difficulty": "easy",
        "topic": "Variables & Data Types",
        "description": "Write a program that reads two integers and prints their sum.",
        "input_format": "Two integers a and b on a single line.",
        "output_format": "Print the sum of a and b.",
        "examples": [
            {"input": "3 5", "output": "8"},
            {"input": "-1 1", "output": "0"}
        ],
        "test_cases": [
            {"input": "3 5", "output": "8"},
            {"input": "-1 1", "output": "0"},
            {"input": "0 0", "output": "0"},
            {"input": "100 200", "output": "300"},
            {"input": "-50 -50", "output": "-100"}
        ]
    },
    {
        "id": "pf-code-002",
        "name": "Even or Odd",
        "difficulty": "easy",
        "topic": "Control Flow",
        "description": "Write a program that reads an integer and prints 'Even' if it's even, 'Odd' otherwise.",
        "input_format": "A single integer n.",
        "output_format": "Print 'Even' or 'Odd'.",
        "examples": [
            {"input": "4", "output": "Even"},
            {"input": "7", "output": "Odd"}
        ],
        "test_cases": [
            {"input": "4", "output": "Even"},
            {"input": "7", "output": "Odd"},
            {"input": "0", "output": "Even"},
            {"input": "-2", "output": "Even"},
            {"input": "-3", "output": "Odd"}
        ]
    },
    {
        "id": "pf-code-003",
        "name": "Factorial",
        "difficulty": "medium",
        "topic": "Loops",
        "description": "Write a program to calculate the factorial of a non-negative integer n.",
        "input_format": "A single non-negative integer n (0 ≤ n ≤ 20).",
        "output_format": "Print n! (factorial of n).",
        "examples": [
            {"input": "5", "output": "120"},
            {"input": "0", "output": "1"}
        ],
        "test_cases": [
            {"input": "5", "output": "120"},
            {"input": "0", "output": "1"},
            {"input": "1", "output": "1"},
            {"input": "10", "output": "3628800"},
            {"input": "3", "output": "6"}
        ]
    },
    {
        "id": "pf-code-004",
        "name": "Fibonacci Number",
        "difficulty": "medium",
        "topic": "Functions",
        "description": "Write a function to find the nth Fibonacci number. F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).",
        "input_format": "A single integer n (0 ≤ n ≤ 30).",
        "output_format": "Print the nth Fibonacci number.",
        "examples": [
            {"input": "6", "output": "8"},
            {"input": "0", "output": "0"}
        ],
        "test_cases": [
            {"input": "6", "output": "8"},
            {"input": "0", "output": "0"},
            {"input": "1", "output": "1"},
            {"input": "10", "output": "55"},
            {"input": "20", "output": "6765"}
        ]
    },
    {
        "id": "pf-code-005",
        "name": "Array Sum",
        "difficulty": "easy",
        "topic": "Arrays",
        "description": "Write a program to find the sum of all elements in an array.",
        "input_format": "First line: n (number of elements). Second line: n integers.",
        "output_format": "Print the sum of all elements.",
        "examples": [
            {"input": "5\n1 2 3 4 5", "output": "15"},
            {"input": "3\n-1 0 1", "output": "0"}
        ],
        "test_cases": [
            {"input": "5\n1 2 3 4 5", "output": "15"},
            {"input": "3\n-1 0 1", "output": "0"},
            {"input": "1\n100", "output": "100"},
            {"input": "4\n10 20 30 40", "output": "100"}
        ]
    },
    {
        "id": "pf-code-006",
        "name": "Reverse String",
        "difficulty": "easy",
        "topic": "Strings",
        "description": "Write a program to reverse a given string.",
        "input_format": "A single string s.",
        "output_format": "Print the reversed string.",
        "examples": [
            {"input": "hello", "output": "olleh"},
            {"input": "abc", "output": "cba"}
        ],
        "test_cases": [
            {"input": "hello", "output": "olleh"},
            {"input": "abc", "output": "cba"},
            {"input": "a", "output": "a"},
            {"input": "racecar", "output": "racecar"},
            {"input": "Python", "output": "nohtyP"}
        ]
    },
    {
        "id": "pf-code-007",
        "name": "Prime Number Check",
        "difficulty": "medium",
        "topic": "Control Flow",
        "description": "Write a program to check if a number is prime.",
        "input_format": "A single integer n (1 ≤ n ≤ 10^6).",
        "output_format": "Print 'Prime' if n is prime, 'Not Prime' otherwise.",
        "examples": [
            {"input": "7", "output": "Prime"},
            {"input": "4", "output": "Not Prime"}
        ],
        "test_cases": [
            {"input": "7", "output": "Prime"},
            {"input": "4", "output": "Not Prime"},
            {"input": "1", "output": "Not Prime"},
            {"input": "2", "output": "Prime"},
            {"input": "97", "output": "Prime"},
            {"input": "100", "output": "Not Prime"}
        ]
    },
    {
        "id": "pf-code-008",
        "name": "Count Vowels",
        "difficulty": "easy",
        "topic": "Strings",
        "description": "Write a program to count the number of vowels (a, e, i, o, u) in a string.",
        "input_format": "A single string s (lowercase letters only).",
        "output_format": "Print the count of vowels.",
        "examples": [
            {"input": "hello", "output": "2"},
            {"input": "rhythm", "output": "0"}
        ],
        "test_cases": [
            {"input": "hello", "output": "2"},
            {"input": "rhythm", "output": "0"},
            {"input": "aeiou", "output": "5"},
            {"input": "programming", "output": "3"},
            {"input": "xyz", "output": "0"}
        ]
    },
    {
        "id": "pf-code-009",
        "name": "Find Maximum",
        "difficulty": "easy",
        "topic": "Arrays",
        "description": "Write a program to find the maximum element in an array.",
        "input_format": "First line: n. Second line: n integers.",
        "output_format": "Print the maximum element.",
        "examples": [
            {"input": "5\n3 1 4 1 5", "output": "5"},
            {"input": "3\n-1 -2 -3", "output": "-1"}
        ],
        "test_cases": [
            {"input": "5\n3 1 4 1 5", "output": "5"},
            {"input": "3\n-1 -2 -3", "output": "-1"},
            {"input": "1\n42", "output": "42"},
            {"input": "4\n100 100 100 100", "output": "100"}
        ]
    },
    {
        "id": "pf-code-010",
        "name": "GCD of Two Numbers",
        "difficulty": "hard",
        "topic": "Functions",
        "description": "Write a program to find the Greatest Common Divisor (GCD) of two numbers using Euclidean algorithm.",
        "input_format": "Two integers a and b.",
        "output_format": "Print the GCD of a and b.",
        "examples": [
            {"input": "48 18", "output": "6"},
            {"input": "100 25", "output": "25"}
        ],
        "test_cases": [
            {"input": "48 18", "output": "6"},
            {"input": "100 25", "output": "25"},
            {"input": "17 13", "output": "1"},
            {"input": "0 5", "output": "5"},
            {"input": "12 12", "output": "12"}
        ]
    },
    {
        "id": "pf-code-011",
        "name": "Count Vowels",
        "difficulty": "easy",
        "topic": "Strings",
        "description": "Count the number of vowels (a, e, i, o, u) in a given string (case-insensitive).",
        "input_format": "A single string s.",
        "output_format": "Print the count of vowels.",
        "examples": [
            {"input": "hello", "output": "2"},
            {"input": "AEIOU", "output": "5"}
        ],
        "test_cases": [
            {"input": "hello", "output": "2"},
            {"input": "AEIOU", "output": "5"},
            {"input": "xyz", "output": "0"},
            {"input": "Programming", "output": "3"},
            {"input": "Education", "output": "5"}
        ]
    },
    {
        "id": "pf-code-012",
        "name": "Palindrome Check",
        "difficulty": "medium",
        "topic": "Strings",
        "description": "Check if a given string is a palindrome (reads same forwards and backwards).",
        "input_format": "A single string s.",
        "output_format": "Print 'Yes' if palindrome, 'No' otherwise.",
        "examples": [
            {"input": "racecar", "output": "Yes"},
            {"input": "hello", "output": "No"}
        ],
        "test_cases": [
            {"input": "racecar", "output": "Yes"},
            {"input": "hello", "output": "No"},
            {"input": "madam", "output": "Yes"},
            {"input": "A", "output": "Yes"},
            {"input": "python", "output": "No"}
        ]
    },
    {
        "id": "pf-code-013",
        "name": "Sum of Digits",
        "difficulty": "easy",
        "topic": "Loops",
        "description": "Calculate the sum of digits of a given integer.",
        "input_format": "A single integer n.",
        "output_format": "Print the sum of digits.",
        "examples": [
            {"input": "123", "output": "6"},
            {"input": "4567", "output": "22"}
        ],
        "test_cases": [
            {"input": "123", "output": "6"},
            {"input": "4567", "output": "22"},
            {"input": "0", "output": "0"},
            {"input": "999", "output": "27"},
            {"input": "100", "output": "1"}
        ]
    },
    {
        "id": "pf-code-014",
        "name": "Find Maximum in Array",
        "difficulty": "easy",
        "topic": "Arrays",
        "description": "Find the maximum element in an array.",
        "input_format": "First line: n. Second line: n integers.",
        "output_format": "Print the maximum element.",
        "examples": [
            {"input": "5\n1 5 3 9 2", "output": "9"},
            {"input": "3\n-1 -5 -3", "output": "-1"}
        ],
        "test_cases": [
            {"input": "5\n1 5 3 9 2", "output": "9"},
            {"input": "3\n-1 -5 -3", "output": "-1"},
            {"input": "1\n100", "output": "100"},
            {"input": "4\n10 20 30 40", "output": "40"},
            {"input": "6\n5 5 5 5 5 5", "output": "5"}
        ]
    },
    {
        "id": "pf-code-015",
        "name": "Count Words",
        "difficulty": "medium",
        "topic": "Strings",
        "description": "Count the number of words in a given sentence.",
        "input_format": "A single line containing a sentence.",
        "output_format": "Print the word count.",
        "examples": [
            {"input": "Hello World", "output": "2"},
            {"input": "I love programming", "output": "3"}
        ],
        "test_cases": [
            {"input": "Hello World", "output": "2"},
            {"input": "I love programming", "output": "3"},
            {"input": "Python", "output": "1"},
            {"input": "The quick brown fox", "output": "4"},
            {"input": "A B C D E", "output": "5"}
        ]
    },
    {
        "id": "pf-code-016",
        "name": "Multiplication Table",
        "difficulty": "easy",
        "topic": "Loops",
        "description": "Print the multiplication table of a given number from 1 to 10.",
        "input_format": "A single integer n.",
        "output_format": "Print 10 lines, each showing n x i = result (i from 1 to 10).",
        "examples": [
            {"input": "5", "output": "5\n10\n15\n20\n25\n30\n35\n40\n45\n50"}
        ],
        "test_cases": [
            {"input": "5", "output": "5\n10\n15\n20\n25\n30\n35\n40\n45\n50"},
            {"input": "2", "output": "2\n4\n6\n8\n10\n12\n14\n16\n18\n20"},
            {"input": "1", "output": "1\n2\n3\n4\n5\n6\n7\n8\n9\n10"}
        ]
    },
    {
        "id": "pf-code-017",
        "name": "Armstrong Number",
        "difficulty": "medium",
        "topic": "Loops",
        "description": "Check if a number is an Armstrong number (sum of cubes of digits equals the number).",
        "input_format": "A single integer n.",
        "output_format": "Print 'Yes' if Armstrong number, 'No' otherwise.",
        "examples": [
            {"input": "153", "output": "Yes"},
            {"input": "123", "output": "No"}
        ],
        "test_cases": [
            {"input": "153", "output": "Yes"},
            {"input": "123", "output": "No"},
            {"input": "370", "output": "Yes"},
            {"input": "9", "output": "Yes"},
            {"input": "100", "output": "No"}
        ]
    },
    {
        "id": "pf-code-018",
        "name": "Second Largest",
        "difficulty": "medium",
        "topic": "Arrays",
        "description": "Find the second largest element in an array.",
        "input_format": "First line: n. Second line: n integers.",
        "output_format": "Print the second largest element.",
        "examples": [
            {"input": "5\n1 5 3 9 2", "output": "5"},
            {"input": "4\n10 20 30 40", "output": "30"}
        ],
        "test_cases": [
            {"input": "5\n1 5 3 9 2", "output": "5"},
            {"input": "4\n10 20 30 40", "output": "30"},
            {"input": "3\n5 5 1", "output": "1"},
            {"input": "6\n100 200 150 175 190 180", "output": "190"}
        ]
    },
    {
        "id": "pf-code-019",
        "name": "Leap Year",
        "difficulty": "medium",
        "topic": "Control Flow",
        "description": "Check if a year is a leap year.",
        "input_format": "A single integer year.",
        "output_format": "Print 'Yes' if leap year, 'No' otherwise.",
        "examples": [
            {"input": "2020", "output": "Yes"},
            {"input": "2021", "output": "No"}
        ],
        "test_cases": [
            {"input": "2020", "output": "Yes"},
            {"input": "2021", "output": "No"},
            {"input": "2000", "output": "Yes"},
            {"input": "1900", "output": "No"},
            {"input": "2024", "output": "Yes"}
        ]
    },
    {
        "id": "pf-code-020",
        "name": "Remove Duplicates",
        "difficulty": "hard",
        "topic": "Arrays",
        "description": "Remove duplicate elements from an array and print unique elements in order.",
        "input_format": "First line: n. Second line: n integers.",
        "output_format": "Print unique elements separated by space.",
        "examples": [
            {"input": "6\n1 2 2 3 4 3", "output": "1 2 3 4"},
            {"input": "5\n5 5 5 5 5", "output": "5"}
        ],
        "test_cases": [
            {"input": "6\n1 2 2 3 4 3", "output": "1 2 3 4"},
            {"input": "5\n5 5 5 5 5", "output": "5"},
            {"input": "4\n1 2 3 4", "output": "1 2 3 4"},
            {"input": "7\n10 20 10 30 20 40 10", "output": "10 20 30 40"}
        ]
    }
]


# ==================== OBJECT-ORIENTED PROGRAMMING ====================

OOP_MCQ_QUESTIONS = [
    # Classes & Objects
    {
        "id": "oop-mcq-001",
        "topic": "Classes & Objects",
        "difficulty": "easy",
        "question": "What is a class in object-oriented programming?",
        "options": [
            {"id": "a", "text": "A variable that stores data", "is_correct": False},
            {"id": "b", "text": "A blueprint for creating objects", "is_correct": True},
            {"id": "c", "text": "A function that performs an action", "is_correct": False},
            {"id": "d", "text": "A loop that iterates over data", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "A class is a blueprint or template that defines the properties and behaviors (methods) that objects of that class will have."
    },
    {
        "id": "oop-mcq-002",
        "topic": "Classes & Objects",
        "difficulty": "easy",
        "question": "What is an object in OOP?",
        "options": [
            {"id": "a", "text": "An instance of a class", "is_correct": True},
            {"id": "b", "text": "A function inside a class", "is_correct": False},
            {"id": "c", "text": "A variable declaration", "is_correct": False},
            {"id": "d", "text": "A type of loop", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "An object is a concrete instance of a class, created using the class as a template."
    },
    {
        "id": "oop-mcq-003",
        "topic": "Classes & Objects",
        "difficulty": "medium",
        "question": "What does the 'self' keyword refer to in Python class methods?",
        "options": [
            {"id": "a", "text": "The class itself", "is_correct": False},
            {"id": "b", "text": "The current instance of the class", "is_correct": True},
            {"id": "c", "text": "The parent class", "is_correct": False},
            {"id": "d", "text": "A global variable", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The 'self' parameter refers to the current instance of the class and is used to access instance variables and methods."
    },
    # Constructors
    {
        "id": "oop-mcq-004",
        "topic": "Constructors",
        "difficulty": "easy",
        "question": "What is the name of the constructor method in Python?",
        "options": [
            {"id": "a", "text": "__init__", "is_correct": True},
            {"id": "b", "text": "constructor", "is_correct": False},
            {"id": "c", "text": "__new__", "is_correct": False},
            {"id": "d", "text": "__create__", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "In Python, __init__ is the constructor method that is automatically called when a new object is created."
    },
    {
        "id": "oop-mcq-005",
        "topic": "Constructors",
        "difficulty": "medium",
        "question": "When is a constructor called?",
        "options": [
            {"id": "a", "text": "When a method is invoked", "is_correct": False},
            {"id": "b", "text": "When a new object is created", "is_correct": True},
            {"id": "c", "text": "When a class is defined", "is_correct": False},
            {"id": "d", "text": "When the program ends", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The constructor is automatically invoked when a new instance of a class is created."
    },
    # Inheritance
    {
        "id": "oop-mcq-006",
        "topic": "Inheritance",
        "difficulty": "easy",
        "question": "What is inheritance in OOP?",
        "options": [
            {"id": "a", "text": "Hiding implementation details", "is_correct": False},
            {"id": "b", "text": "A class acquiring properties of another class", "is_correct": True},
            {"id": "c", "text": "Having multiple forms", "is_correct": False},
            {"id": "d", "text": "Grouping related data", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Inheritance allows a child class to inherit properties and methods from a parent class, promoting code reuse."
    },
    {
        "id": "oop-mcq-007",
        "topic": "Inheritance",
        "difficulty": "medium",
        "question": "What function is used to call a parent class method in Python?",
        "options": [
            {"id": "a", "text": "parent()", "is_correct": False},
            {"id": "b", "text": "super()", "is_correct": True},
            {"id": "c", "text": "base()", "is_correct": False},
            {"id": "d", "text": "this()", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The super() function is used to call methods from a parent class in Python."
    },
    {
        "id": "oop-mcq-008",
        "topic": "Inheritance",
        "difficulty": "hard",
        "question": "What is the 'Diamond Problem' in OOP?",
        "options": [
            {"id": "a", "text": "A memory leak issue", "is_correct": False},
            {"id": "b", "text": "Ambiguity in multiple inheritance", "is_correct": True},
            {"id": "c", "text": "A syntax error in classes", "is_correct": False},
            {"id": "d", "text": "Circular dependency in imports", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The Diamond Problem occurs when a class inherits from two classes that both inherit from a common base class, causing ambiguity about which path to follow."
    },
    # Polymorphism
    {
        "id": "oop-mcq-009",
        "topic": "Polymorphism",
        "difficulty": "easy",
        "question": "What does polymorphism mean in OOP?",
        "options": [
            {"id": "a", "text": "One interface, many implementations", "is_correct": True},
            {"id": "b", "text": "Hiding data from outside", "is_correct": False},
            {"id": "c", "text": "Creating multiple objects", "is_correct": False},
            {"id": "d", "text": "Destroying unused objects", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "Polymorphism means 'many forms' - it allows objects of different classes to be treated through the same interface."
    },
    {
        "id": "oop-mcq-010",
        "topic": "Polymorphism",
        "difficulty": "medium",
        "question": "What is method overriding?",
        "options": [
            {"id": "a", "text": "Defining multiple methods with the same name but different parameters", "is_correct": False},
            {"id": "b", "text": "A child class providing a specific implementation of a parent's method", "is_correct": True},
            {"id": "c", "text": "Calling a method from another class", "is_correct": False},
            {"id": "d", "text": "Deleting a method from a class", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Method overriding occurs when a child class provides its own implementation of a method already defined in its parent class."
    },
    # Encapsulation
    {
        "id": "oop-mcq-011",
        "topic": "Encapsulation",
        "difficulty": "easy",
        "question": "What is encapsulation in OOP?",
        "options": [
            {"id": "a", "text": "Inheriting from multiple classes", "is_correct": False},
            {"id": "b", "text": "Bundling data and methods that operate on that data", "is_correct": True},
            {"id": "c", "text": "Creating abstract classes", "is_correct": False},
            {"id": "d", "text": "Converting objects to strings", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Encapsulation is the bundling of data (attributes) and methods that operate on that data within a single unit (class), often with access restrictions."
    },
    {
        "id": "oop-mcq-012",
        "topic": "Encapsulation",
        "difficulty": "medium",
        "question": "In Python, how do you indicate a private attribute?",
        "options": [
            {"id": "a", "text": "Using the 'private' keyword", "is_correct": False},
            {"id": "b", "text": "Prefixing with double underscore __", "is_correct": True},
            {"id": "c", "text": "Using the 'protected' keyword", "is_correct": False},
            {"id": "d", "text": "Prefixing with @private", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "In Python, prefixing an attribute with double underscore (__) makes it private through name mangling."
    },
    # Abstraction
    {
        "id": "oop-mcq-013",
        "topic": "Abstraction",
        "difficulty": "medium",
        "question": "What is an abstract class?",
        "options": [
            {"id": "a", "text": "A class that cannot be instantiated directly", "is_correct": True},
            {"id": "b", "text": "A class with no methods", "is_correct": False},
            {"id": "c", "text": "A class that inherits from multiple classes", "is_correct": False},
            {"id": "d", "text": "A class with only static methods", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "An abstract class cannot be instantiated directly and typically contains abstract methods that must be implemented by subclasses."
    },
    {
        "id": "oop-mcq-014",
        "topic": "Abstraction",
        "difficulty": "hard",
        "question": "In Python, which module is used to create abstract classes?",
        "options": [
            {"id": "a", "text": "abstract", "is_correct": False},
            {"id": "b", "text": "abc", "is_correct": True},
            {"id": "c", "text": "interface", "is_correct": False},
            {"id": "d", "text": "virtual", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The 'abc' (Abstract Base Classes) module in Python provides tools for defining abstract classes and methods."
    },
    {
        "id": "oop-mcq-015",
        "topic": "General OOP",
        "difficulty": "hard",
        "question": "Which of the following is NOT a pillar of OOP?",
        "options": [
            {"id": "a", "text": "Encapsulation", "is_correct": False},
            {"id": "b", "text": "Compilation", "is_correct": True},
            {"id": "c", "text": "Inheritance", "is_correct": False},
            {"id": "d", "text": "Polymorphism", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The four pillars of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction. Compilation is not a pillar of OOP."
    }
]

OOP_CODING_PROBLEMS = [
    {
        "id": "oop-code-001",
        "name": "Simple Class",
        "difficulty": "easy",
        "topic": "Classes & Objects",
        "description": "Create a class 'Rectangle' with length and width. Implement a method to calculate area. Read l and w, create an object, and print the area.",
        "input_format": "Two integers l and w (length and width).",
        "output_format": "Print the area of the rectangle.",
        "examples": [
            {"input": "5 3", "output": "15"},
            {"input": "10 10", "output": "100"}
        ],
        "test_cases": [
            {"input": "5 3", "output": "15"},
            {"input": "10 10", "output": "100"},
            {"input": "1 1", "output": "1"},
            {"input": "100 50", "output": "5000"}
        ]
    },
    {
        "id": "oop-code-002",
        "name": "Bank Account",
        "difficulty": "medium",
        "topic": "Encapsulation",
        "description": "Create a BankAccount class with private balance. Implement deposit, withdraw, and get_balance methods. Process transactions and print final balance.",
        "input_format": "First line: initial balance. Second line: n (number of operations). Next n lines: 'D amount' for deposit or 'W amount' for withdraw.",
        "output_format": "Print the final balance. If withdraw fails (insufficient funds), print 'Insufficient funds' and continue.",
        "examples": [
            {"input": "100\n3\nD 50\nW 30\nW 200", "output": "Insufficient funds\n120"},
            {"input": "500\n2\nD 100\nW 200", "output": "400"}
        ],
        "test_cases": [
            {"input": "100\n3\nD 50\nW 30\nW 200", "output": "Insufficient funds\n120"},
            {"input": "500\n2\nD 100\nW 200", "output": "400"},
            {"input": "0\n1\nD 100", "output": "100"},
            {"input": "100\n1\nW 100", "output": "0"}
        ]
    },
    {
        "id": "oop-code-003",
        "name": "Shape Inheritance",
        "difficulty": "medium",
        "topic": "Inheritance",
        "description": "Create a Shape base class with an area method. Create Circle and Square subclasses that override area. Read shape type and dimension, print the area.",
        "input_format": "First line: shape type ('Circle' or 'Square'). Second line: dimension (radius for circle, side for square).",
        "output_format": "Print the area rounded to 2 decimal places.",
        "examples": [
            {"input": "Circle\n5", "output": "78.54"},
            {"input": "Square\n4", "output": "16.00"}
        ],
        "test_cases": [
            {"input": "Circle\n5", "output": "78.54"},
            {"input": "Square\n4", "output": "16.00"},
            {"input": "Circle\n1", "output": "3.14"},
            {"input": "Square\n10", "output": "100.00"}
        ]
    },
    {
        "id": "oop-code-004",
        "name": "Employee Management",
        "difficulty": "hard",
        "topic": "Polymorphism",
        "description": "Create an Employee base class with calculate_salary method. Create FullTime and PartTime subclasses. FullTime has monthly_salary, PartTime has hourly_rate and hours_worked.",
        "input_format": "First line: employee type ('F' for FullTime, 'P' for PartTime). Second line: salary details (monthly_salary for F, hourly_rate and hours for P).",
        "output_format": "Print the calculated salary.",
        "examples": [
            {"input": "F\n5000", "output": "5000"},
            {"input": "P\n20 160", "output": "3200"}
        ],
        "test_cases": [
            {"input": "F\n5000", "output": "5000"},
            {"input": "P\n20 160", "output": "3200"},
            {"input": "F\n10000", "output": "10000"},
            {"input": "P\n15 100", "output": "1500"}
        ]
    },
    {
        "id": "oop-code-005",
        "name": "Student Grade System",
        "difficulty": "medium",
        "topic": "Classes & Objects",
        "description": "Create a Student class with name and list of scores. Implement methods to add_score, get_average, and get_grade (A>=90, B>=80, C>=70, D>=60, F<60).",
        "input_format": "First line: student name. Second line: n (number of scores). Third line: n scores.",
        "output_format": "Print average (2 decimal places) and grade.",
        "examples": [
            {"input": "Alice\n3\n85 90 88", "output": "87.67\nB"},
            {"input": "Bob\n4\n70 65 72 68", "output": "68.75\nD"}
        ],
        "test_cases": [
            {"input": "Alice\n3\n85 90 88", "output": "87.67\nB"},
            {"input": "Bob\n4\n70 65 72 68", "output": "68.75\nD"},
            {"input": "Charlie\n2\n100 100", "output": "100.00\nA"},
            {"input": "David\n3\n50 55 45", "output": "50.00\nF"}
        ]
    },
    {
        "id": "oop-code-006",
        "name": "Book Library System",
        "difficulty": "medium",
        "topic": "Classes & Objects",
        "description": "Create a Book class with title, author, isbn. Create a Library class to add_book, find_book_by_isbn, and list_all_books.",
        "input_format": "Commands: ADD title|author|isbn, FIND isbn, LIST",
        "output_format": "For FIND: print title and author or 'Not found'. For LIST: print count of books.",
        "examples": [
            {"input": "ADD The Alchemist|Paulo Coelho|123\nFIND 123", "output": "The Alchemist by Paulo Coelho"},
            {"input": "ADD Book1|Author1|001\nADD Book2|Author2|002\nLIST", "output": "2"}
        ],
        "test_cases": [
            {"input": "ADD The Alchemist|Paulo Coelho|123\nFIND 123", "output": "The Alchemist by Paulo Coelho"},
            {"input": "ADD Book1|Author1|001\nADD Book2|Author2|002\nLIST", "output": "2"},
            {"input": "FIND 999", "output": "Not found"}
        ]
    },
    {
        "id": "oop-code-007",
        "name": "Vehicle Hierarchy",
        "difficulty": "medium",
        "topic": "Inheritance",
        "description": "Create Vehicle base class with make and model. Create Car and Bike subclasses with specific attributes. Implement display_info method.",
        "input_format": "Type (Car/Bike), make, model, specific_attr (doors for Car, type for Bike).",
        "output_format": "Print vehicle information.",
        "examples": [
            {"input": "Car\nToyota\nCamry\n4", "output": "Car: Toyota Camry, Doors: 4"},
            {"input": "Bike\nHonda\nCBR\nSport", "output": "Bike: Honda CBR, Type: Sport"}
        ],
        "test_cases": [
            {"input": "Car\nToyota\nCamry\n4", "output": "Car: Toyota Camry, Doors: 4"},
            {"input": "Bike\nHonda\nCBR\nSport", "output": "Bike: Honda CBR, Type: Sport"},
            {"input": "Car\nFord\nMustang\n2", "output": "Car: Ford Mustang, Doors: 2"}
        ]
    },
    {
        "id": "oop-code-008",
        "name": "Shopping Cart",
        "difficulty": "medium",
        "topic": "Classes & Objects",
        "description": "Create Item class with name and price. Create Cart class with add_item, remove_item, and get_total methods.",
        "input_format": "Commands: ADD name price, REMOVE name, TOTAL",
        "output_format": "For TOTAL: print total price.",
        "examples": [
            {"input": "ADD Apple 100\nADD Banana 50\nTOTAL", "output": "150"},
            {"input": "ADD Item1 200\nADD Item2 300\nREMOVE Item1\nTOTAL", "output": "300"}
        ],
        "test_cases": [
            {"input": "ADD Apple 100\nADD Banana 50\nTOTAL", "output": "150"},
            {"input": "ADD Item1 200\nADD Item2 300\nREMOVE Item1\nTOTAL", "output": "300"},
            {"input": "ADD X 500\nTOTAL", "output": "500"}
        ]
    },
    {
        "id": "oop-code-009",
        "name": "Employee Management",
        "difficulty": "hard",
        "topic": "Encapsulation",
        "description": "Create Employee class with private attributes _name and _salary. Implement getter/setter methods with validation (salary must be positive).",
        "input_format": "Commands: SET_NAME name, SET_SALARY amount, GET_NAME, GET_SALARY",
        "output_format": "Print requested information or 'Invalid' for invalid salary.",
        "examples": [
            {"input": "SET_NAME John\nSET_SALARY 50000\nGET_NAME\nGET_SALARY", "output": "John\n50000"},
            {"input": "SET_SALARY -100", "output": "Invalid"}
        ],
        "test_cases": [
            {"input": "SET_NAME John\nSET_SALARY 50000\nGET_NAME", "output": "John"},
            {"input": "SET_SALARY -100", "output": "Invalid"},
            {"input": "SET_NAME Alice\nGET_NAME", "output": "Alice"}
        ]
    },
    {
        "id": "oop-code-010",
        "name": "Shape Calculator",
        "difficulty": "medium",
        "topic": "Polymorphism",
        "description": "Create Shape base class with area method. Create Circle and Rectangle subclasses implementing area calculation.",
        "input_format": "Shape type (Circle/Rectangle) and dimensions (radius for Circle, length width for Rectangle).",
        "output_format": "Print area (2 decimal places).",
        "examples": [
            {"input": "Circle\n5", "output": "78.54"},
            {"input": "Rectangle\n4 6", "output": "24.00"}
        ],
        "test_cases": [
            {"input": "Circle\n5", "output": "78.54"},
            {"input": "Rectangle\n4 6", "output": "24.00"},
            {"input": "Circle\n10", "output": "314.16"}
        ]
    },
    {
        "id": "oop-code-011",
        "name": "Counter Class",
        "difficulty": "easy",
        "topic": "Classes & Objects",
        "description": "Create a Counter class with increment, decrement, and get_value methods.",
        "input_format": "Commands: INC, DEC, GET",
        "output_format": "For GET: print current counter value.",
        "examples": [
            {"input": "INC\nINC\nGET", "output": "2"},
            {"input": "INC\nDEC\nGET", "output": "0"}
        ],
        "test_cases": [
            {"input": "INC\nINC\nGET", "output": "2"},
            {"input": "INC\nDEC\nGET", "output": "0"},
            {"input": "GET", "output": "0"},
            {"input": "INC\nINC\nINC\nGET", "output": "3"}
        ]
    },
    {
        "id": "oop-code-012",
        "name": "Temperature Converter",
        "difficulty": "easy",
        "topic": "Classes & Objects",
        "description": "Create Temperature class with celsius_to_fahrenheit and fahrenheit_to_celsius methods.",
        "input_format": "Conversion type (C2F/F2C) and temperature value.",
        "output_format": "Print converted temperature (2 decimal places).",
        "examples": [
            {"input": "C2F\n0", "output": "32.00"},
            {"input": "F2C\n32", "output": "0.00"}
        ],
        "test_cases": [
            {"input": "C2F\n0", "output": "32.00"},
            {"input": "F2C\n32", "output": "0.00"},
            {"input": "C2F\n100", "output": "212.00"},
            {"input": "F2C\n212", "output": "100.00"}
        ]
    },
    {
        "id": "oop-code-013",
        "name": "Point Distance",
        "difficulty": "medium",
        "topic": "Classes & Objects",
        "description": "Create Point class with x and y coordinates. Implement distance_from method to calculate Euclidean distance from another point.",
        "input_format": "Four integers: x1 y1 x2 y2",
        "output_format": "Print distance (2 decimal places).",
        "examples": [
            {"input": "0 0 3 4", "output": "5.00"},
            {"input": "1 1 4 5", "output": "5.00"}
        ],
        "test_cases": [
            {"input": "0 0 3 4", "output": "5.00"},
            {"input": "1 1 4 5", "output": "5.00"},
            {"input": "0 0 0 0", "output": "0.00"}
        ]
    },
    {
        "id": "oop-code-014",
        "name": "Fraction Class",
        "difficulty": "hard",
        "topic": "Operator Overloading",
        "description": "Create Fraction class with numerator and denominator. Implement add method to add two fractions.",
        "input_format": "Four integers: num1 den1 num2 den2",
        "output_format": "Print result as 'numerator/denominator' in simplest form.",
        "examples": [
            {"input": "1 2 1 3", "output": "5/6"},
            {"input": "1 4 1 4", "output": "1/2"}
        ],
        "test_cases": [
            {"input": "1 2 1 3", "output": "5/6"},
            {"input": "1 4 1 4", "output": "1/2"},
            {"input": "2 3 1 3", "output": "1/1"}
        ]
    },
    {
        "id": "oop-code-015",
        "name": "Time Class",
        "difficulty": "medium",
        "topic": "Classes & Objects",
        "description": "Create Time class with hours, minutes, seconds. Implement add_seconds method and display in HH:MM:SS format.",
        "input_format": "hours minutes seconds seconds_to_add",
        "output_format": "Print time in HH:MM:SS format after adding seconds.",
        "examples": [
            {"input": "10 30 45 20", "output": "10:31:05"},
            {"input": "23 59 50 15", "output": "00:00:05"}
        ],
        "test_cases": [
            {"input": "10 30 45 20", "output": "10:31:05"},
            {"input": "23 59 50 15", "output": "00:00:05"},
            {"input": "0 0 0 3661", "output": "01:01:01"}
        ]
    },
    {
        "id": "oop-code-016",
        "name": "Matrix Class",
        "difficulty": "hard",
        "topic": "Classes & Objects",
        "description": "Create Matrix class for 2x2 matrices. Implement add method to add two matrices.",
        "input_format": "8 integers: matrix1 (4 values) matrix2 (4 values)",
        "output_format": "Print result matrix in 2 lines.",
        "examples": [
            {"input": "1 2 3 4 5 6 7 8", "output": "6 8\n10 12"}
        ],
        "test_cases": [
            {"input": "1 2 3 4 5 6 7 8", "output": "6 8\n10 12"},
            {"input": "0 0 0 0 1 1 1 1", "output": "1 1\n1 1"}
        ]
    },
    {
        "id": "oop-code-017",
        "name": "Password Validator",
        "difficulty": "medium",
        "topic": "Encapsulation",
        "description": "Create PasswordValidator class to check if password is valid (min 8 chars, has uppercase, lowercase, digit).",
        "input_format": "A password string.",
        "output_format": "Print 'Valid' or 'Invalid'.",
        "examples": [
            {"input": "Pass123word", "output": "Valid"},
            {"input": "weak", "output": "Invalid"}
        ],
        "test_cases": [
            {"input": "Pass123word", "output": "Valid"},
            {"input": "weak", "output": "Invalid"},
            {"input": "NoDigits", "output": "Invalid"},
            {"input": "Good1Pass", "output": "Valid"}
        ]
    },
    {
        "id": "oop-code-018",
        "name": "Stack Implementation",
        "difficulty": "hard",
        "topic": "Data Structures in OOP",
        "description": "Implement Stack class with push, pop, and is_empty methods.",
        "input_format": "Commands: PUSH value, POP, EMPTY",
        "output_format": "For POP: print popped value or 'Empty'. For EMPTY: print 'Yes' or 'No'.",
        "examples": [
            {"input": "PUSH 10\nPUSH 20\nPOP", "output": "20"},
            {"input": "POP", "output": "Empty"}
        ],
        "test_cases": [
            {"input": "PUSH 10\nPUSH 20\nPOP", "output": "20"},
            {"input": "POP", "output": "Empty"},
            {"input": "EMPTY", "output": "Yes"}
        ]
    },
    {
        "id": "oop-code-019",
        "name": "Queue Implementation",
        "difficulty": "hard",
        "topic": "Data Structures in OOP",
        "description": "Implement Queue class with enqueue, dequeue, and size methods.",
        "input_format": "Commands: ENQ value, DEQ, SIZE",
        "output_format": "For DEQ: print dequeued value or 'Empty'. For SIZE: print queue size.",
        "examples": [
            {"input": "ENQ 10\nENQ 20\nDEQ", "output": "10"},
            {"input": "ENQ 5\nSIZE", "output": "1"}
        ],
        "test_cases": [
            {"input": "ENQ 10\nENQ 20\nDEQ", "output": "10"},
            {"input": "ENQ 5\nSIZE", "output": "1"},
            {"input": "DEQ", "output": "Empty"}
        ]
    },
    {
        "id": "oop-code-020",
        "name": "Linked List Node",
        "difficulty": "hard",
        "topic": "Data Structures in OOP",
        "description": "Create Node class and LinkedList class with insert_at_beginning and display methods.",
        "input_format": "Commands: INSERT value, DISPLAY",
        "output_format": "For DISPLAY: print all values separated by space.",
        "examples": [
            {"input": "INSERT 10\nINSERT 20\nDISPLAY", "output": "20 10"},
            {"input": "INSERT 5\nDISPLAY", "output": "5"}
        ],
        "test_cases": [
            {"input": "INSERT 10\nINSERT 20\nDISPLAY", "output": "20 10"},
            {"input": "INSERT 5\nDISPLAY", "output": "5"},
            {"input": "INSERT 1\nINSERT 2\nINSERT 3\nDISPLAY", "output": "3 2 1"}
        ]
    }
]


# ==================== DATA STRUCTURES ====================

DSA_MCQ_QUESTIONS = [
    # Arrays & Strings
    {
        "id": "dsa-mcq-001",
        "topic": "Arrays & Strings",
        "difficulty": "easy",
        "question": "What is the time complexity of accessing an element by index in an array?",
        "options": [
            {"id": "a", "text": "O(1)", "is_correct": True},
            {"id": "b", "text": "O(n)", "is_correct": False},
            {"id": "c", "text": "O(log n)", "is_correct": False},
            {"id": "d", "text": "O(n²)", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "Arrays provide O(1) constant time access to elements by index because elements are stored in contiguous memory locations."
    },
    {
        "id": "dsa-mcq-002",
        "topic": "Arrays & Strings",
        "difficulty": "medium",
        "question": "What is the time complexity of inserting an element at the beginning of an array?",
        "options": [
            {"id": "a", "text": "O(1)", "is_correct": False},
            {"id": "b", "text": "O(n)", "is_correct": True},
            {"id": "c", "text": "O(log n)", "is_correct": False},
            {"id": "d", "text": "O(n log n)", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Inserting at the beginning requires shifting all existing elements one position to the right, which takes O(n) time."
    },
    # Linked Lists
    {
        "id": "dsa-mcq-003",
        "topic": "Linked Lists",
        "difficulty": "easy",
        "question": "What is the main advantage of a linked list over an array?",
        "options": [
            {"id": "a", "text": "Faster random access", "is_correct": False},
            {"id": "b", "text": "Dynamic size and efficient insertion/deletion", "is_correct": True},
            {"id": "c", "text": "Less memory usage", "is_correct": False},
            {"id": "d", "text": "Better cache performance", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Linked lists can grow dynamically and allow O(1) insertion/deletion at known positions without shifting elements."
    },
    {
        "id": "dsa-mcq-004",
        "topic": "Linked Lists",
        "difficulty": "medium",
        "question": "In a doubly linked list, each node contains:",
        "options": [
            {"id": "a", "text": "Only data", "is_correct": False},
            {"id": "b", "text": "Data and pointer to next node", "is_correct": False},
            {"id": "c", "text": "Data and pointers to both next and previous nodes", "is_correct": True},
            {"id": "d", "text": "Data and pointer to head", "is_correct": False}
        ],
        "correct_option": "c",
        "explanation": "A doubly linked list node contains data plus pointers to both the next and previous nodes, allowing traversal in both directions."
    },
    # Stacks & Queues
    {
        "id": "dsa-mcq-005",
        "topic": "Stacks & Queues",
        "difficulty": "easy",
        "question": "What principle does a Stack follow?",
        "options": [
            {"id": "a", "text": "FIFO (First In First Out)", "is_correct": False},
            {"id": "b", "text": "LIFO (Last In First Out)", "is_correct": True},
            {"id": "c", "text": "Random Access", "is_correct": False},
            {"id": "d", "text": "Priority Based", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Stack follows LIFO principle - the last element added is the first one to be removed."
    },
    {
        "id": "dsa-mcq-006",
        "topic": "Stacks & Queues",
        "difficulty": "easy",
        "question": "What principle does a Queue follow?",
        "options": [
            {"id": "a", "text": "FIFO (First In First Out)", "is_correct": True},
            {"id": "b", "text": "LIFO (Last In First Out)", "is_correct": False},
            {"id": "c", "text": "Random Access", "is_correct": False},
            {"id": "d", "text": "Sorted Order", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "Queue follows FIFO principle - the first element added is the first one to be removed."
    },
    {
        "id": "dsa-mcq-007",
        "topic": "Stacks & Queues",
        "difficulty": "medium",
        "question": "Which application commonly uses a stack?",
        "options": [
            {"id": "a", "text": "Print queue management", "is_correct": False},
            {"id": "b", "text": "Function call management (call stack)", "is_correct": True},
            {"id": "c", "text": "CPU task scheduling", "is_correct": False},
            {"id": "d", "text": "Breadth-first search", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "The call stack is used to manage function calls - when a function is called, it's pushed onto the stack; when it returns, it's popped."
    },
    # Trees
    {
        "id": "dsa-mcq-008",
        "topic": "Trees",
        "difficulty": "easy",
        "question": "In a Binary Search Tree, for any node:",
        "options": [
            {"id": "a", "text": "Left child > Node > Right child", "is_correct": False},
            {"id": "b", "text": "Left child < Node < Right child", "is_correct": True},
            {"id": "c", "text": "Left child = Right child", "is_correct": False},
            {"id": "d", "text": "No ordering is maintained", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "In a BST, for every node, all values in the left subtree are smaller, and all values in the right subtree are larger."
    },
    {
        "id": "dsa-mcq-009",
        "topic": "Trees",
        "difficulty": "medium",
        "question": "What is the time complexity of searching in a balanced BST?",
        "options": [
            {"id": "a", "text": "O(1)", "is_correct": False},
            {"id": "b", "text": "O(n)", "is_correct": False},
            {"id": "c", "text": "O(log n)", "is_correct": True},
            {"id": "d", "text": "O(n²)", "is_correct": False}
        ],
        "correct_option": "c",
        "explanation": "In a balanced BST, the height is log(n), and we traverse from root to leaf, giving O(log n) search time."
    },
    {
        "id": "dsa-mcq-010",
        "topic": "Trees",
        "difficulty": "hard",
        "question": "What is the worst-case time complexity of searching in an unbalanced BST?",
        "options": [
            {"id": "a", "text": "O(1)", "is_correct": False},
            {"id": "b", "text": "O(log n)", "is_correct": False},
            {"id": "c", "text": "O(n)", "is_correct": True},
            {"id": "d", "text": "O(n log n)", "is_correct": False}
        ],
        "correct_option": "c",
        "explanation": "In the worst case, an unbalanced BST degenerates into a linked list (skewed tree), making search O(n)."
    },
    # Graphs
    {
        "id": "dsa-mcq-011",
        "topic": "Graphs",
        "difficulty": "easy",
        "question": "Which data structure is typically used for implementing BFS?",
        "options": [
            {"id": "a", "text": "Stack", "is_correct": False},
            {"id": "b", "text": "Queue", "is_correct": True},
            {"id": "c", "text": "Heap", "is_correct": False},
            {"id": "d", "text": "Array", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "BFS uses a queue to process nodes level by level in FIFO order."
    },
    {
        "id": "dsa-mcq-012",
        "topic": "Graphs",
        "difficulty": "medium",
        "question": "Which data structure is typically used for implementing DFS?",
        "options": [
            {"id": "a", "text": "Stack (or recursion)", "is_correct": True},
            {"id": "b", "text": "Queue", "is_correct": False},
            {"id": "c", "text": "Hash Table", "is_correct": False},
            {"id": "d", "text": "Heap", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "DFS uses a stack (explicitly or via recursion) to explore as deep as possible before backtracking."
    },
    # Hash Tables
    {
        "id": "dsa-mcq-013",
        "topic": "Hash Tables",
        "difficulty": "easy",
        "question": "What is the average time complexity of insertion in a hash table?",
        "options": [
            {"id": "a", "text": "O(1)", "is_correct": True},
            {"id": "b", "text": "O(n)", "is_correct": False},
            {"id": "c", "text": "O(log n)", "is_correct": False},
            {"id": "d", "text": "O(n²)", "is_correct": False}
        ],
        "correct_option": "a",
        "explanation": "With a good hash function and proper load factor, hash table operations (insert, search, delete) are O(1) on average."
    },
    {
        "id": "dsa-mcq-014",
        "topic": "Hash Tables",
        "difficulty": "medium",
        "question": "What is a collision in a hash table?",
        "options": [
            {"id": "a", "text": "When the hash table is full", "is_correct": False},
            {"id": "b", "text": "When two keys hash to the same index", "is_correct": True},
            {"id": "c", "text": "When a key cannot be found", "is_correct": False},
            {"id": "d", "text": "When the hash function fails", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "A collision occurs when two different keys produce the same hash value, mapping to the same index in the table."
    },
    {
        "id": "dsa-mcq-015",
        "topic": "Complexity Analysis",
        "difficulty": "hard",
        "question": "Which sorting algorithm has O(n log n) time complexity in all cases (best, average, worst)?",
        "options": [
            {"id": "a", "text": "Quick Sort", "is_correct": False},
            {"id": "b", "text": "Merge Sort", "is_correct": True},
            {"id": "c", "text": "Bubble Sort", "is_correct": False},
            {"id": "d", "text": "Insertion Sort", "is_correct": False}
        ],
        "correct_option": "b",
        "explanation": "Merge Sort always divides the array in half and merges, giving O(n log n) in all cases. Quick Sort's worst case is O(n²)."
    }
]

DSA_CODING_PROBLEMS = [
    {
        "id": "dsa-code-001",
        "name": "Reverse Array",
        "difficulty": "easy",
        "topic": "Arrays & Strings",
        "description": "Write a program to reverse an array in-place.",
        "input_format": "First line: n. Second line: n integers.",
        "output_format": "Print the reversed array.",
        "examples": [
            {"input": "5\n1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "3\n10 20 30", "output": "30 20 10"}
        ],
        "test_cases": [
            {"input": "5\n1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "3\n10 20 30", "output": "30 20 10"},
            {"input": "1\n100", "output": "100"},
            {"input": "4\n1 1 1 1", "output": "1 1 1 1"}
        ]
    },
    {
        "id": "dsa-code-002",
        "name": "Valid Parentheses",
        "difficulty": "medium",
        "topic": "Stacks & Queues",
        "description": "Given a string containing only '(', ')', '{', '}', '[', ']', determine if the input string is valid. Brackets must close in the correct order.",
        "input_format": "A single string s containing brackets.",
        "output_format": "Print 'Valid' if valid, 'Invalid' otherwise.",
        "examples": [
            {"input": "()", "output": "Valid"},
            {"input": "()[]{}", "output": "Valid"},
            {"input": "(]", "output": "Invalid"}
        ],
        "test_cases": [
            {"input": "()", "output": "Valid"},
            {"input": "()[]{}", "output": "Valid"},
            {"input": "(]", "output": "Invalid"},
            {"input": "([)]", "output": "Invalid"},
            {"input": "{[]}", "output": "Valid"},
            {"input": "", "output": "Valid"}
        ]
    },
    {
        "id": "dsa-code-003",
        "name": "Linked List Reversal",
        "difficulty": "medium",
        "topic": "Linked Lists",
        "description": "Given a singly linked list, reverse it and print the result.",
        "input_format": "First line: n. Second line: n integers (linked list values).",
        "output_format": "Print the reversed linked list values.",
        "examples": [
            {"input": "5\n1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "2\n1 2", "output": "2 1"}
        ],
        "test_cases": [
            {"input": "5\n1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "2\n1 2", "output": "2 1"},
            {"input": "1\n1", "output": "1"},
            {"input": "3\n10 20 30", "output": "30 20 10"}
        ]
    },
    {
        "id": "dsa-code-004",
        "name": "BST Insertion",
        "difficulty": "medium",
        "topic": "Trees",
        "description": "Given n numbers, insert them into a BST in the given order. Then print the inorder traversal.",
        "input_format": "First line: n. Second line: n integers to insert.",
        "output_format": "Print the inorder traversal of the BST.",
        "examples": [
            {"input": "5\n5 3 7 2 4", "output": "2 3 4 5 7"},
            {"input": "3\n2 1 3", "output": "1 2 3"}
        ],
        "test_cases": [
            {"input": "5\n5 3 7 2 4", "output": "2 3 4 5 7"},
            {"input": "3\n2 1 3", "output": "1 2 3"},
            {"input": "1\n10", "output": "10"},
            {"input": "4\n4 2 6 5", "output": "2 4 5 6"}
        ]
    },
    {
        "id": "dsa-code-005",
        "name": "BFS Traversal",
        "difficulty": "hard",
        "topic": "Graphs",
        "description": "Given a graph with n nodes and m edges, perform BFS starting from node 1. Print nodes in BFS order.",
        "input_format": "First line: n m. Next m lines: u v (undirected edge).",
        "output_format": "Print BFS traversal starting from node 1.",
        "examples": [
            {"input": "4 3\n1 2\n1 3\n2 4", "output": "1 2 3 4"},
            {"input": "3 2\n1 2\n2 3", "output": "1 2 3"}
        ],
        "test_cases": [
            {"input": "4 3\n1 2\n1 3\n2 4", "output": "1 2 3 4"},
            {"input": "3 2\n1 2\n2 3", "output": "1 2 3"},
            {"input": "1 0", "output": "1"},
            {"input": "5 4\n1 2\n1 3\n2 4\n3 5", "output": "1 2 3 4 5"}
        ]
    },
    {
        "id": "dsa-code-006",
        "name": "Two Sum Hash",
        "difficulty": "medium",
        "topic": "Hash Tables",
        "description": "Given an array of integers and a target sum, find if there exist two numbers that add up to the target using a hash table approach.",
        "input_format": "First line: n target. Second line: n integers.",
        "output_format": "Print 'Yes' if two numbers add up to target, 'No' otherwise.",
        "examples": [
            {"input": "4 9\n2 7 11 15", "output": "Yes"},
            {"input": "3 6\n1 2 3", "output": "No"}
        ],
        "test_cases": [
            {"input": "4 9\n2 7 11 15", "output": "Yes"},
            {"input": "3 6\n1 2 3", "output": "No"},
            {"input": "2 10\n5 5", "output": "Yes"},
            {"input": "5 10\n1 2 3 4 5", "output": "No"}
        ]
    },
    {
        "id": "dsa-code-007",
        "name": "Queue Implementation",
        "difficulty": "easy",
        "topic": "Stacks & Queues",
        "description": "Implement a queue and process operations: 'E x' to enqueue x, 'D' to dequeue and print, 'P' to print front without removing.",
        "input_format": "First line: n. Next n lines: operations.",
        "output_format": "Print output for D and P operations. Print 'Empty' if queue is empty for D or P.",
        "examples": [
            {"input": "5\nE 1\nE 2\nD\nP\nD", "output": "1\n2\n2"},
            {"input": "3\nD\nE 5\nP", "output": "Empty\n5"}
        ],
        "test_cases": [
            {"input": "5\nE 1\nE 2\nD\nP\nD", "output": "1\n2\n2"},
            {"input": "3\nD\nE 5\nP", "output": "Empty\n5"},
            {"input": "2\nE 10\nD", "output": "10"}
        ]
    },
    {
        "id": "dsa-code-008",
        "name": "Merge Two Sorted Arrays",
        "difficulty": "easy",
        "topic": "Arrays & Strings",
        "description": "Given two sorted arrays, merge them into a single sorted array.",
        "input_format": "First line: n m. Second line: n integers (first array). Third line: m integers (second array).",
        "output_format": "Print the merged sorted array.",
        "examples": [
            {"input": "3 3\n1 3 5\n2 4 6", "output": "1 2 3 4 5 6"},
            {"input": "2 4\n1 10\n2 3 4 5", "output": "1 2 3 4 5 10"}
        ],
        "test_cases": [
            {"input": "3 3\n1 3 5\n2 4 6", "output": "1 2 3 4 5 6"},
            {"input": "2 4\n1 10\n2 3 4 5", "output": "1 2 3 4 5 10"},
            {"input": "1 1\n1\n2", "output": "1 2"},
            {"input": "3 2\n1 1 1\n2 2", "output": "1 1 1 2 2"}
        ]
    },
    {
        "id": "dsa-code-009",
        "name": "Level Order Traversal",
        "difficulty": "hard",
        "topic": "Trees",
        "description": "Given a binary tree in array representation (1-indexed, -1 for null), print level order traversal.",
        "input_format": "First line: n. Second line: n integers (tree in array form, -1 for null).",
        "output_format": "Print level order traversal (skip nulls).",
        "examples": [
            {"input": "7\n1 2 3 4 5 6 7", "output": "1 2 3 4 5 6 7"},
            {"input": "5\n1 2 3 -1 4", "output": "1 2 3 4"}
        ],
        "test_cases": [
            {"input": "7\n1 2 3 4 5 6 7", "output": "1 2 3 4 5 6 7"},
            {"input": "5\n1 2 3 -1 4", "output": "1 2 3 4"},
            {"input": "1\n10", "output": "10"},
            {"input": "3\n5 3 8", "output": "5 3 8"}
        ]
    },
    {
        "id": "dsa-code-010",
        "name": "Detect Cycle in Graph",
        "difficulty": "hard",
        "topic": "Graphs",
        "description": "Given an undirected graph, detect if it contains a cycle.",
        "input_format": "First line: n m. Next m lines: u v (undirected edge).",
        "output_format": "Print 'Cycle' if cycle exists, 'No Cycle' otherwise.",
        "examples": [
            {"input": "4 4\n1 2\n2 3\n3 4\n4 1", "output": "Cycle"},
            {"input": "3 2\n1 2\n2 3", "output": "No Cycle"}
        ],
        "test_cases": [
            {"input": "4 4\n1 2\n2 3\n3 4\n4 1", "output": "Cycle"},
            {"input": "3 2\n1 2\n2 3", "output": "No Cycle"},
            {"input": "4 3\n1 2\n2 3\n3 1", "output": "Cycle"},
            {"input": "2 1\n1 2", "output": "No Cycle"}
        ]
    },
    {
        "id": "dsa-code-011",
        "name": "Merge Two Sorted Arrays",
        "difficulty": "easy",
        "topic": "Arrays",
        "description": "Merge two sorted arrays into one sorted array.",
        "input_format": "First line: n. Second line: n sorted integers. Third line: m. Fourth line: m sorted integers.",
        "output_format": "Print merged sorted array.",
        "examples": [
            {"input": "3\n1 3 5\n3\n2 4 6", "output": "1 2 3 4 5 6"}
        ],
        "test_cases": [
            {"input": "3\n1 3 5\n3\n2 4 6", "output": "1 2 3 4 5 6"},
            {"input": "2\n1 2\n2\n3 4", "output": "1 2 3 4"},
            {"input": "1\n5\n1\n3", "output": "3 5"}
        ]
    },
    {
        "id": "dsa-code-012",
        "name": "Find Kth Largest",
        "difficulty": "medium",
        "topic": "Arrays & Heaps",
        "description": "Find the kth largest element in an unsorted array.",
        "input_format": "First line: n k. Second line: n integers.",
        "output_format": "Print the kth largest element.",
        "examples": [
            {"input": "5 2\n3 2 1 5 4", "output": "4"},
            {"input": "6 3\n1 1 1 2 2 3", "output": "1"}
        ],
        "test_cases": [
            {"input": "5 2\n3 2 1 5 4", "output": "4"},
            {"input": "6 3\n1 1 1 2 2 3", "output": "1"},
            {"input": "4 1\n10 20 30 40", "output": "40"}
        ]
    },
    {
        "id": "dsa-code-013",
        "name": "Reverse Linked List",
        "difficulty": "medium",
        "topic": "Linked Lists",
        "description": "Reverse a singly linked list.",
        "input_format": "First line: n. Second line: n integers representing list.",
        "output_format": "Print reversed list.",
        "examples": [
            {"input": "5\n1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "1\n42", "output": "42"}
        ],
        "test_cases": [
            {"input": "5\n1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "1\n42", "output": "42"},
            {"input": "3\n10 20 30", "output": "30 20 10"}
        ]
    },
    {
        "id": "dsa-code-014",
        "name": "Valid Parentheses",
        "difficulty": "medium",
        "topic": "Stacks",
        "description": "Check if a string of parentheses (), {}, [] is valid (properly matched and nested).",
        "input_format": "A string containing only parentheses characters.",
        "output_format": "Print 'Valid' or 'Invalid'.",
        "examples": [
            {"input": "()[]{}", "output": "Valid"},
            {"input": "([)]", "output": "Invalid"}
        ],
        "test_cases": [
            {"input": "()[]{}", "output": "Valid"},
            {"input": "([)]", "output": "Invalid"},
            {"input": "{[()]}", "output": "Valid"},
            {"input": "((", "output": "Invalid"}
        ]
    },
    {
        "id": "dsa-code-015",
        "name": "Level Order Traversal",
        "difficulty": "medium",
        "topic": "Trees & Queues",
        "description": "Perform level order traversal of a binary tree.",
        "input_format": "First line: n. Second line: n integers (use -1 for null nodes).",
        "output_format": "Print level order traversal.",
        "examples": [
            {"input": "7\n1 2 3 4 5 6 7", "output": "1 2 3 4 5 6 7"}
        ],
        "test_cases": [
            {"input": "7\n1 2 3 4 5 6 7", "output": "1 2 3 4 5 6 7"},
            {"input": "1\n10", "output": "10"}
        ]
    },
    {
        "id": "dsa-code-016",
        "name": "Hash Map Implementation",
        "difficulty": "medium",
        "topic": "Hash Tables",
        "description": "Implement basic hash map operations: PUT key value, GET key.",
        "input_format": "Commands: PUT k v, GET k",
        "output_format": "For GET: print value or 'None'.",
        "examples": [
            {"input": "PUT 1 10\nGET 1", "output": "10"},
            {"input": "GET 99", "output": "None"}
        ],
        "test_cases": [
            {"input": "PUT 1 10\nGET 1", "output": "10"},
            {"input": "GET 99", "output": "None"},
            {"input": "PUT 5 50\nPUT 5 60\nGET 5", "output": "60"}
        ]
    },
    {
        "id": "dsa-code-017",
        "name": "Dijkstra's Shortest Path",
        "difficulty": "hard",
        "topic": "Graphs & Heaps",
        "description": "Find shortest path from source to all vertices using Dijkstra's algorithm.",
        "input_format": "First line: n m s. Next m lines: u v w (edge from u to v with weight w).",
        "output_format": "Print shortest distances from source s to all vertices.",
        "examples": [
            {"input": "3 3 1\n1 2 1\n2 3 2\n1 3 4", "output": "0 1 3"}
        ],
        "test_cases": [
            {"input": "3 3 1\n1 2 1\n2 3 2\n1 3 4", "output": "0 1 3"}
        ]
    },
    {
        "id": "dsa-code-018",
        "name": "Topological Sort",
        "difficulty": "hard",
        "topic": "Graphs",
        "description": "Perform topological sort on a directed acyclic graph.",
        "input_format": "First line: n m. Next m lines: u v (directed edge).",
        "output_format": "Print one valid topological ordering.",
        "examples": [
            {"input": "4 4\n1 2\n1 3\n2 4\n3 4", "output": "1 2 3 4"}
        ],
        "test_cases": [
            {"input": "4 4\n1 2\n1 3\n2 4\n3 4", "output": "1 2 3 4"}
        ]
    },
    {
        "id": "dsa-code-019",
        "name": "Trie Insert and Search",
        "difficulty": "hard",
        "topic": "Tries",
        "description": "Implement Trie with insert and search operations.",
        "input_format": "Commands: INSERT word, SEARCH word",
        "output_format": "For SEARCH: print 'Found' or 'Not Found'.",
        "examples": [
            {"input": "INSERT hello\nSEARCH hello", "output": "Found"},
            {"input": "SEARCH world", "output": "Not Found"}
        ],
        "test_cases": [
            {"input": "INSERT hello\nSEARCH hello", "output": "Found"},
            {"input": "SEARCH world", "output": "Not Found"},
            {"input": "INSERT test\nINSERT testing\nSEARCH test", "output": "Found"}
        ]
    },
    {
        "id": "dsa-code-020",
        "name": "LRU Cache",
        "difficulty": "hard",
        "topic": "Hash Tables & Linked Lists",
        "description": "Implement LRU (Least Recently Used) Cache with get and put operations.",
        "input_format": "First line: capacity. Commands: PUT k v, GET k",
        "output_format": "For GET: print value or '-1' if not found.",
        "examples": [
            {"input": "2\nPUT 1 10\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2", "output": "10\n-1"}
        ],
        "test_cases": [
            {"input": "2\nPUT 1 10\nPUT 2 20\nGET 1", "output": "10"},
            {"input": "1\nPUT 1 10\nGET 1", "output": "10"}
        ]
    }
]


# ==================== HELPER FUNCTIONS ====================

def get_all_mcqs():
    """Get all MCQ questions from all modules."""
    return PF_MCQ_QUESTIONS + OOP_MCQ_QUESTIONS + DSA_MCQ_QUESTIONS

def get_mcqs_by_module(module_id):
    """Get MCQs for a specific module."""
    module_map = {
        'programming-fundamentals': PF_MCQ_QUESTIONS,
        'oop': OOP_MCQ_QUESTIONS,
        'data-structures': DSA_MCQ_QUESTIONS
    }
    return module_map.get(module_id, [])

def get_all_coding_problems():
    """Get all coding problems from all modules."""
    return PF_CODING_PROBLEMS + OOP_CODING_PROBLEMS + DSA_CODING_PROBLEMS

def get_coding_problems_by_module(module_id):
    """Get coding problems for a specific module."""
    module_map = {
        'programming-fundamentals': PF_CODING_PROBLEMS,
        'oop': OOP_CODING_PROBLEMS,
        'data-structures': DSA_CODING_PROBLEMS
    }
    return module_map.get(module_id, [])

def get_mcq_by_id(mcq_id):
    """Get a single MCQ by ID."""
    for mcq in get_all_mcqs():
        if mcq['id'] == mcq_id:
            return mcq
    return None

def get_coding_problem_by_id(problem_id):
    """Get a single coding problem by ID."""
    for problem in get_all_coding_problems():
        if problem['id'] == problem_id:
            return problem
    return None

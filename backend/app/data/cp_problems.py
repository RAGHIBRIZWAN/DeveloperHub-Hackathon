"""
Hardcoded Competitive Programming Problems
==========================================
20 problems from easy (800) to hard (3500) rating with test cases.
"""

CP_PROBLEMS = [
    # ============ Rating 800-1000 (Newbie) ============
    {
        "id": "cp-001",
        "name": "Watermelon",
        "rating": 800,
        "tags": ["math", "brute force"],
        "difficulty": "easy",
        "description": """Pete and Billy bought a watermelon weighing w kilos. They want to divide it into two parts so that each part weighs an even number of kilos. 

Determine whether they can do this.

Each part should weigh at least 2 kilos.""",
        "input_format": "A single integer w (1 ≤ w ≤ 100) — the weight of the watermelon.",
        "output_format": 'Print "YES" if they can divide the watermelon, and "NO" otherwise.',
        "examples": [
            {"input": "8", "output": "YES", "explanation": "8 can be divided into 4 + 4"},
            {"input": "5", "output": "NO", "explanation": "5 cannot be divided into two even numbers"}
        ],
        "test_cases": [
            {"input": "8", "output": "YES"},
            {"input": "5", "output": "NO"},
            {"input": "4", "output": "YES"},
            {"input": "2", "output": "NO"},
            {"input": "6", "output": "YES"},
            {"input": "100", "output": "YES"},
            {"input": "3", "output": "NO"},
            {"input": "10", "output": "YES"}
        ],
        "solution_hint": "A number can be split into two even parts if it's even and greater than 2."
    },
    {
        "id": "cp-002",
        "name": "Way Too Long Words",
        "rating": 800,
        "tags": ["strings", "implementation"],
        "difficulty": "easy",
        "description": """Sometimes some words like "localization" or "internationalization" are so long that writing them many times in one text is quite tiresome.

Let's consider a word too long, if its length is strictly more than 10 characters. All too long words should be replaced with a special abbreviation.

This abbreviation is made like this: we write down the first and the last letter of a word and between them we write the number of letters between the first and the last letters.""",
        "input_format": "The first line contains an integer n (1 ≤ n ≤ 100). Each of the following n lines contains one word. All the words consist of lowercase Latin letters and possess the lengths of from 1 to 100 characters.",
        "output_format": "Print the result of replacing each word.",
        "examples": [
            {"input": "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", "output": "word\nl10n\ni18n\np43s", "explanation": "Words with length > 10 are abbreviated"}
        ],
        "test_cases": [
            {"input": "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", "output": "word\nl10n\ni18n\np43s"},
            {"input": "1\nabcdefghijk", "output": "a9k"},
            {"input": "1\nhello", "output": "hello"},
            {"input": "2\nabcdefghijkl\nshort", "output": "a10l\nshort"},
            {"input": "1\nabcdefghij", "output": "abcdefghij"},
            {"input": "1\nabcdefghijk", "output": "a9k"}
        ],
        "solution_hint": "Check if length > 10, then format as first_char + (length-2) + last_char"
    },
    {
        "id": "cp-003",
        "name": "Team",
        "rating": 800,
        "tags": ["brute force", "greedy"],
        "difficulty": "easy",
        "description": """One day three best friends Petya, Vasya and Tonya decided to form a team and take part in programming contests. Contestants are usually offered several problems during programming contests. Long before the start, the friends decided that they will implement a solution for a problem only when at least two of them are sure about the solution. Otherwise, they don't write the solution.

Help the friends find the number of problems they'll solve.""",
        "input_format": "The first input line contains n (1 ≤ n ≤ 1000) — the number of problems. Each of the next n lines contains three integers: 0 or 1, where 1 means that the friend is sure about the solution and 0 means not sure.",
        "output_format": "Print a single integer — the number of problems they'll solve.",
        "examples": [
            {"input": "3\n1 1 0\n1 1 1\n1 0 0", "output": "2", "explanation": "Problems 1 and 2 have at least 2 friends sure"}
        ],
        "test_cases": [
            {"input": "3\n1 1 0\n1 1 1\n1 0 0", "output": "2"},
            {"input": "2\n1 0 0\n0 1 1", "output": "1"},
            {"input": "1\n1 1 1", "output": "1"},
            {"input": "1\n0 0 0", "output": "0"},
            {"input": "5\n1 1 1\n1 1 1\n1 1 1\n1 1 1\n1 1 1", "output": "5"},
            {"input": "4\n0 0 0\n0 0 1\n1 0 0\n0 1 0", "output": "0"}
        ],
        "solution_hint": "Count problems where sum of 3 integers >= 2"
    },
    
    # ============ Rating 1100-1200 (Pupil) ============
    {
        "id": "cp-004",
        "name": "Beautiful Year",
        "rating": 1000,
        "tags": ["brute force"],
        "difficulty": "easy",
        "description": """It seems like the year of 2013 came only yesterday. But soon 2014 will pass and next year will come. Gleb thinks a year is beautiful if all its four digits are distinct. 

For example, 1982 and 2013 are beautiful years, but 2015, 2100 and 1111 are not.

What is the next beautiful year after year y?""",
        "input_format": "A single integer y (1000 ≤ y ≤ 9000).",
        "output_format": "Print the next beautiful year.",
        "examples": [
            {"input": "1987", "output": "2013", "explanation": "2013 is the first year after 1987 with all distinct digits"},
            {"input": "2013", "output": "2014", "explanation": "2014 has all distinct digits"}
        ],
        "test_cases": [
            {"input": "1987", "output": "2013"},
            {"input": "2013", "output": "2014"},
            {"input": "2014", "output": "2015"},
            {"input": "2015", "output": "2016"},
            {"input": "1000", "output": "1023"},
            {"input": "8999", "output": "9012"}
        ],
        "solution_hint": "Check each year starting from y+1 until all 4 digits are distinct"
    },
    {
        "id": "cp-005",
        "name": "Sum of Digits",
        "rating": 1100,
        "tags": ["implementation", "math"],
        "difficulty": "easy",
        "description": """Given a non-negative integer n, compute the sum of its digits.

For example, if n = 1234, the answer is 1 + 2 + 3 + 4 = 10.""",
        "input_format": "A single non-negative integer n (0 ≤ n ≤ 10^9).",
        "output_format": "Print the sum of digits of n.",
        "examples": [
            {"input": "1234", "output": "10", "explanation": "1 + 2 + 3 + 4 = 10"},
            {"input": "999", "output": "27", "explanation": "9 + 9 + 9 = 27"}
        ],
        "test_cases": [
            {"input": "1234", "output": "10"},
            {"input": "999", "output": "27"},
            {"input": "0", "output": "0"},
            {"input": "1", "output": "1"},
            {"input": "1000000000", "output": "1"},
            {"input": "123456789", "output": "45"}
        ],
        "solution_hint": "Iterate through each digit using modulo and division"
    },
    {
        "id": "cp-006",
        "name": "Even Odd",
        "rating": 1100,
        "tags": ["math"],
        "difficulty": "easy",
        "description": """You are given two integers L and R. Find the count of integers in the range [L, R] (inclusive) that are even.""",
        "input_format": "Two integers L and R (1 ≤ L ≤ R ≤ 10^9).",
        "output_format": "Print the count of even numbers in the range.",
        "examples": [
            {"input": "1 10", "output": "5", "explanation": "Even numbers: 2, 4, 6, 8, 10"},
            {"input": "5 5", "output": "0", "explanation": "5 is odd"}
        ],
        "test_cases": [
            {"input": "1 10", "output": "5"},
            {"input": "5 5", "output": "0"},
            {"input": "2 2", "output": "1"},
            {"input": "1 1", "output": "0"},
            {"input": "1 100", "output": "50"},
            {"input": "2 100", "output": "50"}
        ],
        "solution_hint": "Use formula: R//2 - (L-1)//2"
    },
    
    # ============ Rating 1200-1400 (Pupil/Specialist) ============
    {
        "id": "cp-007",
        "name": "Nearly Lucky Number",
        "rating": 1200,
        "tags": ["implementation", "strings"],
        "difficulty": "medium",
        "description": """A number is called lucky if it consists only of digits 4 and 7.

A number is called nearly lucky if the count of lucky digits (4 and 7) in it is a lucky number itself.

Determine if a given number n is nearly lucky.""",
        "input_format": "A single integer n (1 ≤ n ≤ 10^18).",
        "output_format": 'Print "YES" if n is nearly lucky, otherwise print "NO".',
        "examples": [
            {"input": "40047", "output": "NO", "explanation": "Has 3 lucky digits (4, 4, 7). 3 is not lucky."},
            {"input": "7747774", "output": "YES", "explanation": "Has 7 lucky digits. 7 is lucky."}
        ],
        "test_cases": [
            {"input": "40047", "output": "NO"},
            {"input": "7747774", "output": "YES"},
            {"input": "1000000000000000000", "output": "NO"},
            {"input": "4444444", "output": "YES"},
            {"input": "4747", "output": "YES"},
            {"input": "123456789", "output": "NO"}
        ],
        "solution_hint": "Count 4s and 7s, then check if that count is made only of 4s and 7s"
    },
    {
        "id": "cp-008",
        "name": "Stones on the Table",
        "rating": 1200,
        "tags": ["implementation"],
        "difficulty": "medium",
        "description": """There are n stones on the table in a row, each of them can be red, green or blue. Count the minimum number of stones to remove so that no two consecutive stones are of the same color.""",
        "input_format": "The first line contains n (1 ≤ n ≤ 50). The second line contains a string of n characters 'R', 'G' or 'B' — the colors of the stones.",
        "output_format": "Print the minimum number of stones to remove.",
        "examples": [
            {"input": "3\nRRG", "output": "1", "explanation": "Remove one R to get RG"},
            {"input": "5\nRRRRR", "output": "4", "explanation": "Remove 4 Rs to get single R"}
        ],
        "test_cases": [
            {"input": "3\nRRG", "output": "1"},
            {"input": "5\nRRRRR", "output": "4"},
            {"input": "4\nBRBG", "output": "0"},
            {"input": "1\nR", "output": "0"},
            {"input": "6\nRRGGBB", "output": "3"},
            {"input": "10\nRGBRGBRGBR", "output": "0"}
        ],
        "solution_hint": "Count consecutive pairs of same color"
    },
    
    # ============ Rating 1400-1600 (Specialist) ============
    {
        "id": "cp-009",
        "name": "Maximum Sum Subarray",
        "rating": 1400,
        "tags": ["dp", "greedy"],
        "difficulty": "medium",
        "description": """Given an array of n integers, find the contiguous subarray with the maximum sum.

This is the famous Kadane's algorithm problem.""",
        "input_format": "The first line contains n (1 ≤ n ≤ 10^5). The second line contains n integers a_i (-10^9 ≤ a_i ≤ 10^9).",
        "output_format": "Print the maximum sum.",
        "examples": [
            {"input": "8\n-2 1 -3 4 -1 2 1 -5 4", "output": "6", "explanation": "Subarray [4, -1, 2, 1] has sum 6"},
            {"input": "1\n-1", "output": "-1", "explanation": "Only element"}
        ],
        "test_cases": [
            {"input": "8\n-2 1 -3 4 -1 2 1 -5 4", "output": "6"},
            {"input": "1\n-1", "output": "-1"},
            {"input": "5\n1 2 3 4 5", "output": "15"},
            {"input": "5\n-1 -2 -3 -4 -5", "output": "-1"},
            {"input": "3\n5 -2 3", "output": "6"},
            {"input": "4\n-2 -3 4 -1", "output": "4"}
        ],
        "solution_hint": "Use Kadane's algorithm: max_ending_here = max(num, max_ending_here + num)"
    },
    {
        "id": "cp-010",
        "name": "Two Sum",
        "rating": 1400,
        "tags": ["hash table", "implementation"],
        "difficulty": "medium",
        "description": """Given an array of integers and a target sum, find two numbers such that they add up to the target.

Return the indices (1-indexed) of the two numbers. If there are multiple solutions, return any. It's guaranteed that a solution exists.""",
        "input_format": "The first line contains n (2 ≤ n ≤ 10^5) and target. The second line contains n integers.",
        "output_format": "Print two indices i and j (1 ≤ i < j ≤ n) such that a[i] + a[j] = target.",
        "examples": [
            {"input": "4 9\n2 7 11 15", "output": "1 2", "explanation": "2 + 7 = 9"},
            {"input": "3 6\n3 2 4", "output": "2 3", "explanation": "2 + 4 = 6"}
        ],
        "test_cases": [
            {"input": "4 9\n2 7 11 15", "output": "1 2"},
            {"input": "3 6\n3 2 4", "output": "2 3"},
            {"input": "2 6\n3 3", "output": "1 2"},
            {"input": "5 10\n1 2 3 7 5", "output": "3 4"},
            {"input": "4 8\n1 2 3 5", "output": "3 4"}
        ],
        "solution_hint": "Use a hash map to store seen numbers and their indices"
    },
    
    # ============ Rating 1600-1900 (Expert) ============
    {
        "id": "cp-011",
        "name": "Binary Search",
        "rating": 1600,
        "tags": ["binary search", "implementation"],
        "difficulty": "medium",
        "description": """Given a sorted array of n integers and q queries. For each query, find the position of element x in the array (1-indexed). If x is not present, output -1.""",
        "input_format": "First line: n q. Second line: n sorted integers. Next q lines: one integer x per line.",
        "output_format": "For each query, print the 1-indexed position or -1.",
        "examples": [
            {"input": "5 3\n1 2 3 4 5\n3\n6\n1", "output": "3\n-1\n1", "explanation": "3 is at position 3, 6 not found, 1 at position 1"}
        ],
        "test_cases": [
            {"input": "5 3\n1 2 3 4 5\n3\n6\n1", "output": "3\n-1\n1"},
            {"input": "5 2\n1 3 5 7 9\n5\n4", "output": "3\n-1"},
            {"input": "1 1\n5\n5", "output": "1"},
            {"input": "3 2\n1 2 3\n0\n4", "output": "-1\n-1"}
        ],
        "solution_hint": "Implement binary search with left, right, and mid pointers"
    },
    {
        "id": "cp-012",
        "name": "Longest Increasing Subsequence",
        "rating": 1700,
        "tags": ["dp", "binary search"],
        "difficulty": "hard",
        "description": """Given an array of n integers, find the length of the longest strictly increasing subsequence.

A subsequence is a sequence that can be derived from the array by deleting some or no elements without changing the order of the remaining elements.""",
        "input_format": "First line: n (1 ≤ n ≤ 10^5). Second line: n integers a_i.",
        "output_format": "Print the length of the longest increasing subsequence.",
        "examples": [
            {"input": "6\n10 9 2 5 3 7", "output": "3", "explanation": "LIS is [2, 5, 7] or [2, 3, 7]"},
            {"input": "8\n0 1 0 3 2 3", "output": "4", "explanation": "LIS is [0, 1, 2, 3]"}
        ],
        "test_cases": [
            {"input": "6\n10 9 2 5 3 7", "output": "3"},
            {"input": "6\n0 1 0 3 2 3", "output": "4"},
            {"input": "7\n7 7 7 7 7 7 7", "output": "1"},
            {"input": "5\n1 2 3 4 5", "output": "5"},
            {"input": "5\n5 4 3 2 1", "output": "1"}
        ],
        "solution_hint": "Use dynamic programming with binary search for O(n log n) solution"
    },
    
    # ============ Rating 1900-2100 (Candidate Master) ============
    {
        "id": "cp-013",
        "name": "Prime Factorization",
        "rating": 1900,
        "tags": ["number theory", "math"],
        "difficulty": "hard",
        "description": """Given a positive integer n, find its prime factorization.

Output the prime factors in increasing order, with each prime factor followed by its exponent.""",
        "input_format": "A single integer n (2 ≤ n ≤ 10^12).",
        "output_format": "Print prime factors in format 'p^e' separated by spaces, in increasing order of p.",
        "examples": [
            {"input": "12", "output": "2^2 3^1", "explanation": "12 = 2^2 * 3^1"},
            {"input": "100", "output": "2^2 5^2", "explanation": "100 = 2^2 * 5^2"}
        ],
        "test_cases": [
            {"input": "12", "output": "2^2 3^1"},
            {"input": "100", "output": "2^2 5^2"},
            {"input": "7", "output": "7^1"},
            {"input": "1024", "output": "2^10"},
            {"input": "30", "output": "2^1 3^1 5^1"}
        ],
        "solution_hint": "Divide by smallest prime until n becomes 1"
    },
    {
        "id": "cp-014",
        "name": "Merge Intervals",
        "rating": 2000,
        "tags": ["sorting", "greedy"],
        "difficulty": "hard",
        "description": """Given a collection of intervals, merge all overlapping intervals.

Two intervals [a, b] and [c, d] overlap if c ≤ b.""",
        "input_format": "First line: n (1 ≤ n ≤ 10^5). Next n lines: two integers l and r for each interval.",
        "output_format": "Print the merged intervals, one per line, sorted by start point.",
        "examples": [
            {"input": "4\n1 3\n2 6\n8 10\n15 18", "output": "1 6\n8 10\n15 18", "explanation": "[1,3] and [2,6] merge to [1,6]"}
        ],
        "test_cases": [
            {"input": "4\n1 3\n2 6\n8 10\n15 18", "output": "1 6\n8 10\n15 18"},
            {"input": "2\n1 4\n4 5", "output": "1 5"},
            {"input": "1\n1 10", "output": "1 10"},
            {"input": "3\n1 2\n3 4\n5 6", "output": "1 2\n3 4\n5 6"}
        ],
        "solution_hint": "Sort by start, then merge consecutive overlapping intervals"
    },
    
    # ============ Rating 2100-2400 (Master) ============
    {
        "id": "cp-015",
        "name": "Shortest Path (Dijkstra)",
        "rating": 2100,
        "tags": ["graphs", "shortest paths"],
        "difficulty": "hard",
        "description": """Given a weighted directed graph with n vertices and m edges, find the shortest path from vertex 1 to vertex n.

Edge weights are positive.""",
        "input_format": "First line: n m (1 ≤ n ≤ 10^5, 0 ≤ m ≤ 2*10^5). Next m lines: u v w - edge from u to v with weight w.",
        "output_format": "Print the shortest distance from 1 to n, or -1 if no path exists.",
        "examples": [
            {"input": "4 5\n1 2 1\n1 3 4\n2 3 2\n2 4 5\n3 4 1", "output": "4", "explanation": "Path: 1 -> 2 -> 3 -> 4 with cost 1+2+1=4"}
        ],
        "test_cases": [
            {"input": "4 5\n1 2 1\n1 3 4\n2 3 2\n2 4 5\n3 4 1", "output": "4"},
            {"input": "3 2\n1 2 1\n2 3 2", "output": "3"},
            {"input": "2 0", "output": "-1"},
            {"input": "2 1\n1 2 10", "output": "10"}
        ],
        "solution_hint": "Use Dijkstra's algorithm with priority queue"
    },
    {
        "id": "cp-016",
        "name": "Knapsack Problem",
        "rating": 2200,
        "tags": ["dp"],
        "difficulty": "hard",
        "description": """Given n items, each with a weight and value, and a knapsack capacity W, find the maximum value that can be put in the knapsack.

Each item can be taken at most once (0/1 knapsack).""",
        "input_format": "First line: n W (1 ≤ n ≤ 100, 1 ≤ W ≤ 10^4). Next n lines: w_i v_i for each item.",
        "output_format": "Print the maximum value achievable.",
        "examples": [
            {"input": "3 50\n10 60\n20 100\n30 120", "output": "220", "explanation": "Take items 2 and 3: weight=50, value=220"}
        ],
        "test_cases": [
            {"input": "3 50\n10 60\n20 100\n30 120", "output": "220"},
            {"input": "3 10\n5 10\n4 40\n6 30", "output": "50"},
            {"input": "1 5\n10 100", "output": "0"},
            {"input": "2 10\n5 10\n5 20", "output": "30"}
        ],
        "solution_hint": "Use 2D DP: dp[i][w] = max value using first i items with capacity w"
    },
    
    # ============ Rating 2400-2700 (Grandmaster) ============
    {
        "id": "cp-017",
        "name": "Segment Tree - Range Sum",
        "rating": 2400,
        "tags": ["data structures", "segment tree"],
        "difficulty": "expert",
        "description": """Implement a segment tree that supports:
1. Point update: change value at index i to x
2. Range query: find sum of elements from index l to r

Given an array of n integers, perform q operations.""",
        "input_format": "First line: n q. Second line: n integers. Next q lines: '1 i x' for update or '2 l r' for query.",
        "output_format": "For each query operation, print the sum.",
        "examples": [
            {"input": "5 3\n1 2 3 4 5\n2 1 3\n1 2 10\n2 1 3", "output": "6\n14", "explanation": "Sum[1..3]=6, update a[2]=10, new sum[1..3]=14"}
        ],
        "test_cases": [
            {"input": "5 3\n1 2 3 4 5\n2 1 3\n1 2 10\n2 1 3", "output": "6\n14"},
            {"input": "3 2\n1 1 1\n2 1 3\n1 1 5", "output": "3"},
            {"input": "4 3\n1 2 3 4\n2 1 4\n2 2 3\n2 1 1", "output": "10\n5\n1"}
        ],
        "solution_hint": "Build segment tree in O(n), query and update in O(log n)"
    },
    {
        "id": "cp-018",
        "name": "Strongly Connected Components",
        "rating": 2500,
        "tags": ["graphs", "dfs", "scc"],
        "difficulty": "expert",
        "description": """Given a directed graph with n vertices and m edges, find the number of strongly connected components (SCCs).

A strongly connected component is a maximal set of vertices such that there is a path between every pair of vertices.""",
        "input_format": "First line: n m. Next m lines: u v - directed edge from u to v.",
        "output_format": "Print the number of SCCs.",
        "examples": [
            {"input": "5 5\n1 2\n2 3\n3 1\n3 4\n4 5", "output": "3", "explanation": "SCCs: {1,2,3}, {4}, {5}"}
        ],
        "test_cases": [
            {"input": "5 5\n1 2\n2 3\n3 1\n3 4\n4 5", "output": "3"},
            {"input": "4 4\n1 2\n2 3\n3 4\n4 1", "output": "1"},
            {"input": "3 0", "output": "3"},
            {"input": "4 3\n1 2\n2 3\n3 4", "output": "4"}
        ],
        "solution_hint": "Use Kosaraju's or Tarjan's algorithm"
    },
    
    # ============ Rating 2700-3500 (International Grandmaster+) ============
    {
        "id": "cp-019",
        "name": "Convex Hull",
        "rating": 2800,
        "tags": ["geometry", "sorting"],
        "difficulty": "expert",
        "description": """Given n points in a 2D plane, find the convex hull. The convex hull is the smallest convex polygon that contains all the points.

Output the vertices of the convex hull in counter-clockwise order, starting from the leftmost point (smallest x, then smallest y if tie).""",
        "input_format": "First line: n (3 ≤ n ≤ 10^5). Next n lines: x_i y_i coordinates.",
        "output_format": "Print the number of vertices k, then k lines with coordinates of hull vertices.",
        "examples": [
            {"input": "5\n0 0\n1 1\n2 0\n2 2\n0 2", "output": "4\n0 0\n2 0\n2 2\n0 2", "explanation": "Point (1,1) is inside the hull"}
        ],
        "test_cases": [
            {"input": "5\n0 0\n1 1\n2 0\n2 2\n0 2", "output": "4\n0 0\n2 0\n2 2\n0 2"},
            {"input": "4\n0 0\n1 0\n1 1\n0 1", "output": "4\n0 0\n1 0\n1 1\n0 1"},
            {"input": "3\n0 0\n1 0\n0 1", "output": "3\n0 0\n1 0\n0 1"}
        ],
        "solution_hint": "Use Graham scan or Andrew's monotone chain algorithm"
    },
    {
        "id": "cp-020",
        "name": "Maximum Flow (Ford-Fulkerson)",
        "rating": 3000,
        "tags": ["graphs", "network flow"],
        "difficulty": "expert",
        "description": """Given a flow network with n vertices and m edges, find the maximum flow from source (vertex 1) to sink (vertex n).

Each edge has a capacity. The flow on each edge cannot exceed its capacity.""",
        "input_format": "First line: n m. Next m lines: u v c - edge from u to v with capacity c.",
        "output_format": "Print the maximum flow value.",
        "examples": [
            {"input": "4 5\n1 2 10\n1 3 10\n2 3 2\n2 4 4\n3 4 9", "output": "13", "explanation": "Max flow is 13"}
        ],
        "test_cases": [
            {"input": "4 5\n1 2 10\n1 3 10\n2 3 2\n2 4 4\n3 4 9", "output": "13"},
            {"input": "2 1\n1 2 100", "output": "100"},
            {"input": "3 2\n1 2 10\n2 3 5", "output": "5"},
            {"input": "4 4\n1 2 5\n1 3 5\n2 4 5\n3 4 5", "output": "10"}
        ],
        "solution_hint": "Use Ford-Fulkerson with BFS (Edmonds-Karp) for O(VE^2)"
    }
]

# Helper function to get problems by difficulty or rating
def get_problems_by_rating(min_rating=None, max_rating=None):
    """Filter problems by rating range."""
    problems = CP_PROBLEMS
    if min_rating:
        problems = [p for p in problems if p["rating"] >= min_rating]
    if max_rating:
        problems = [p for p in problems if p["rating"] <= max_rating]
    return problems

def get_problems_by_difficulty(difficulty):
    """Filter problems by difficulty level."""
    return [p for p in CP_PROBLEMS if p["difficulty"] == difficulty]

def get_problem_by_id(problem_id):
    """Get a single problem by ID."""
    for p in CP_PROBLEMS:
        if p["id"] == problem_id:
            return p
    return None

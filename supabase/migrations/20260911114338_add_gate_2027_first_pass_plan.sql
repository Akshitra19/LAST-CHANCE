-- Frozen 112-day LAST CHANCE first-pass plan. Preserves eligible legacy progress.

begin;

create temporary table _plan_manifest (
  task_date date not null, plan_slot smallint not null, subject_code text not null, topic_code text,
  task_type text not null, planned_minutes integer not null, notes text not null,
  primary key (task_date, plan_slot)
) on commit drop;

insert into _plan_manifest (task_date, plan_slot, subject_code, topic_code, task_type, planned_minutes, notes) values
  ('2026-09-11'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-C-PROGRAM-STRUCTURE', 'THEORY', 180, '09:00–12:00 | C program structure, tokens, variables/constants, data types, basic I/O'),
  ('2026-09-11'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-LOGIC-PROPOSITIONS-AND-CONNECTIVES', 'MATH', 120, '14:00–16:00 | Propositions and logical connectives'),
  ('2026-09-11'::date, 3, 'GA', 'GA-S1-BASIC-ENGLISH-GRAMMAR', 'APTITUDE', 60, '16:15–17:15 | GA overview + Basic English grammar'),
  ('2026-09-12'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-TYPE-CONVERSION-AND-CASTING', 'THEORY', 180, '09:00–12:00 | Type conversion/casting, operators, precedence, associativity, expressions'),
  ('2026-09-12'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-LOGIC-TRUTH-TABLES', 'MATH', 180, '14:00–17:00 | Truth tables'),
  ('2026-09-12'::date, 3, 'GA', 'GA-S1-TENSES', 'APTITUDE', 60, '17:15–18:15 | Tenses'),
  ('2026-09-13'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-CONDITIONAL-STATEMENTS', 'THEORY', 180, '09:00–12:00 | if/else, switch, loops, break/continue, tracing'),
  ('2026-09-13'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-LOGIC-IMPLICATION-AND-EQUIVALENCE', 'MATH', 180, '14:00–17:00 | Implication and equivalence'),
  ('2026-09-13'::date, 3, 'GA', 'GA-S1-ARTICLES', 'APTITUDE', 60, '17:15–18:15 | Articles'),
  ('2026-09-14'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-FUNCTIONS-AND-PROTOTYPES', 'THEORY', 180, '09:00–12:00 | Functions, prototypes, parameter passing, return values'),
  ('2026-09-14'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-LOGIC-LOGICAL-IDENTITIES', 'MATH', 180, '14:00–17:00 | Logical identities and normal-form foundations'),
  ('2026-09-14'::date, 3, 'GA', 'GA-S1-ADJECTIVES', 'APTITUDE', 60, '17:15–18:15 | Adjectives'),
  ('2026-09-15'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-SCOPE-AND-LIFETIME', 'THEORY', 180, '09:00–12:00 | Scope, lifetime, storage classes and array introduction'),
  ('2026-09-15'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-LOGIC-PREDICATES-AND-QUANTIFIERS', 'MATH', 120, '14:00–16:00 | Predicates and quantifiers'),
  ('2026-09-15'::date, 3, 'GA', 'GA-S1-PREPOSITIONS', 'APTITUDE', 60, '16:15–17:15 | Prepositions'),
  ('2026-09-16'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-ARRAYS-ARRAY-REPRESENTATION', 'THEORY', 180, '09:00–12:00 | Arrays, multidimensional arrays and address calculation'),
  ('2026-09-16'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-LOGIC-LOGICAL-INFERENCE', 'MATH', 120, '14:00–16:00 | Logical inference'),
  ('2026-09-16'::date, 3, 'GA', 'GA-S1-CONJUNCTIONS', 'APTITUDE', 60, '16:15–17:15 | Conjunctions'),
  ('2026-09-17'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-CHARACTER-ARRAYS-AND-STRINGS', 'THEORY', 180, '09:00–12:00 | Character arrays and strings'),
  ('2026-09-17'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DM-LOGIC', 'MATH', 120, '14:00–16:00 | Logic PYQs and revision'),
  ('2026-09-17'::date, 3, 'GA', 'GA-S1-VERB-NOUN-AGREEMENT', 'APTITUDE', 60, '16:15–17:15 | Verb-noun agreement'),
  ('2026-09-18'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-POINTER-FUNDAMENTALS', 'THEORY', 180, '09:00–12:00 | Pointer fundamentals, addresses, dereferencing, pointer types, NULL'),
  ('2026-09-18'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-SETS-RELATIONS-FUNCTIONS-SET-OPERATIONS', 'MATH', 120, '14:00–16:00 | Sets, operations and Cartesian products'),
  ('2026-09-18'::date, 3, 'GA', 'GA-S1-OTHER-PARTS-SPEECH', 'APTITUDE', 60, '16:15–17:15 | Other parts of speech'),
  ('2026-09-19'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-POINTER-ARITHMETIC', 'THEORY', 180, '09:00–12:00 | Pointer arithmetic and arrays/pointers relationship'),
  ('2026-09-19'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-SETS-RELATIONS-FUNCTIONS-RELATION-PROPERTIES', 'MATH', 180, '14:00–17:00 | Relations and properties'),
  ('2026-09-19'::date, 3, 'GA', 'GA-S1-BASIC-VOCABULARY', 'APTITUDE', 60, '17:15–18:15 | Basic vocabulary'),
  ('2026-09-20'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-PROGRAMMING-C-POINTER-TO-POINTER', 'THEORY', 180, '09:00–12:00 | Pointer-to-pointer, function pointers foundations, structures, unions, enums, typedef, dynamic-memory foundations'),
  ('2026-09-20'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-SETS-RELATIONS-FUNCTIONS-EQUIVALENCE-RELATIONS', 'MATH', 180, '14:00–17:00 | Equivalence relations'),
  ('2026-09-20'::date, 3, 'GA', 'GA-S1-WORDS-CONTEXT', 'APTITUDE', 60, '17:15–18:15 | Words in context'),
  ('2026-09-21'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-RECURSION-BASE-CONDITION', 'THEORY', 180, '09:00–12:00 | Recursion — base case, stack, return tracing, multiple recursive calls'),
  ('2026-09-21'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-SETS-RELATIONS-FUNCTIONS-FUNCTIONS', 'MATH', 180, '14:00–17:00 | Functions'),
  ('2026-09-21'::date, 3, 'GA', 'GA-S1-IDIOMS-CONTEXT', 'APTITUDE', 60, '17:15–18:15 | Idioms in context'),
  ('2026-09-22'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-ARRAYS-ARRAY-REPRESENTATION', 'THEORY', 180, '09:00–12:00 | Arrays as DS — representation, operations, 1D/2D address problems'),
  ('2026-09-22'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-SETS-RELATIONS-FUNCTIONS-FUNCTION-COMPOSITION', 'MATH', 120, '14:00–16:00 | Composition/inverse, one-one and onto'),
  ('2026-09-22'::date, 3, 'GA', 'GA-S1-PHRASES-CONTEXT', 'APTITUDE', 60, '16:15–17:15 | Phrases in context'),
  ('2026-09-23'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-STACKS-STACK-OPERATIONS', 'THEORY', 180, '09:00–12:00 | Stacks — operations, array/linked implementation, applications'),
  ('2026-09-23'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DM-SETS-RELATIONS-FUNCTIONS', 'MATH', 120, '14:00–16:00 | Sets/relations/functions PYQs'),
  ('2026-09-23'::date, 3, 'GA', 'GA-S1-READING-COMPREHENSION', 'APTITUDE', 60, '16:15–17:15 | Reading comprehension'),
  ('2026-09-24'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-QUEUES-LINEAR-QUEUE', 'THEORY', 180, '09:00–12:00 | Queues — linear/circular queue, deque foundations, implementation'),
  ('2026-09-24'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-PARTIAL-ORDERS-LATTICES-POSETS', 'MATH', 120, '14:00–16:00 | Partial orders / posets'),
  ('2026-09-24'::date, 3, 'GA', 'GA-S1-NARRATIVE-SEQUENCING', 'APTITUDE', 60, '16:15–17:15 | Narrative sequencing'),
  ('2026-09-25'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-LINKED-LISTS-SINGLY-LINKED-LIST', 'THEORY', 180, '09:00–12:00 | Linked Lists I — singly linked list, insertion/deletion/traversal'),
  ('2026-09-25'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-PARTIAL-ORDERS-LATTICES-HASSE-DIAGRAMS', 'MATH', 120, '14:00–16:00 | Hasse diagrams'),
  ('2026-09-25'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '16:15–17:15 | Data Interpretation overview'),
  ('2026-09-26'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-LINKED-LISTS-DOUBLY-LINKED-LIST', 'THEORY', 180, '09:00–12:00 | Linked Lists II — doubly and circular lists, problems'),
  ('2026-09-26'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-PARTIAL-ORDERS-LATTICES-LATTICES', 'MATH', 180, '14:00–17:00 | Lattices'),
  ('2026-09-26'::date, 3, 'GA', 'GA-S2-BAR-GRAPHS', 'APTITUDE', 60, '17:15–18:15 | Bar graphs'),
  ('2026-09-27'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-TREES-TREE-TERMINOLOGY', 'THEORY', 180, '09:00–12:00 | Trees I — terminology, representation, binary trees, traversals'),
  ('2026-09-27'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DM-PARTIAL-ORDERS-LATTICES', 'MATH', 180, '14:00–17:00 | Posets/lattices PYQs'),
  ('2026-09-27'::date, 3, 'GA', 'GA-S2-PIE-CHARTS', 'APTITUDE', 60, '17:15–18:15 | Pie charts'),
  ('2026-09-28'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-TREES-PREORDER-TRAVERSAL', 'THEORY', 180, '09:00–12:00 | Trees II — preorder/inorder/postorder and reconstruction'),
  ('2026-09-28'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-MONOIDS-GROUPS-BINARY-OPERATIONS', 'MATH', 180, '14:00–17:00 | Binary operations'),
  ('2026-09-28'::date, 3, 'GA', 'GA-S2-OTHER-DATA-GRAPHS', 'APTITUDE', 60, '17:15–18:15 | Other data graphs'),
  ('2026-09-29'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-BINARY-SEARCH-TREES-BST-SEARCH', 'THEORY', 180, '09:00–12:00 | BST — search, insertion, deletion, complexity'),
  ('2026-09-29'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-MONOIDS-GROUPS-MONOIDS', 'MATH', 120, '14:00–16:00 | Monoids'),
  ('2026-09-29'::date, 3, 'GA', 'GA-S2-2D-PLOTS', 'APTITUDE', 60, '16:15–17:15 | 2D plots'),
  ('2026-09-30'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-BINARY-HEAPS-MIN-HEAP', 'THEORY', 180, '09:00–12:00 | Binary heaps — min/max heap, heapify, insert, extract/delete'),
  ('2026-09-30'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-MONOIDS-GROUPS-GROUPS', 'MATH', 120, '14:00–16:00 | Groups'),
  ('2026-09-30'::date, 3, 'GA', 'GA-S2-3D-PLOTS', 'APTITUDE', 60, '16:15–17:15 | 3D plots'),
  ('2026-10-01'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'PREP-G27-CS-S4-GRAPHS-GRAPH-TERMINOLOGY', 'THEORY', 180, '09:00–12:00 | Graphs as DS — terminology, adjacency matrix/list, representation'),
  ('2026-10-01'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DM-MONOIDS-GROUPS', 'MATH', 120, '14:00–16:00 | Monoids/groups PYQs'),
  ('2026-10-01'::date, 3, 'GA', 'GA-S2-MAPS', 'APTITUDE', 60, '16:15–17:15 | Maps'),
  ('2026-10-02'::date, 1, 'CS-S4-PROGRAMMING-DATA-STRUCTURES', null, 'TEST', 180, '09:00–12:00 | Programming/Data Structures mixed PYQs and weak-area test'),
  ('2026-10-02'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING-GRAPH-FUNDAMENTALS', 'MATH', 180, '14:00–17:00 | Graph fundamentals'),
  ('2026-10-02'::date, 3, 'GA', 'GA-S2-TABLES', 'APTITUDE', 60, '17:15–18:15 | Tables'),
  ('2026-10-03'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-ASYMPTOTIC-WORST-CASE-TIME-BIG-O', 'THEORY', 180, '09:00–12:00 | Big-O, Big-Omega, Big-Theta and worst-case time'),
  ('2026-10-03'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING-PATHS-AND-CONNECTIVITY', 'MATH', 180, '14:00–17:00 | Paths and connectivity'),
  ('2026-10-03'::date, 3, 'GA', 'GA-S2-NUMERICAL-COMPUTATION-ESTIMATION', 'APTITUDE', 60, '17:15–18:15 | Numerical computation and estimation'),
  ('2026-10-04'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-ASYMPTOTIC-WORST-CASE-TIME-LOOP-COMPLEXITY-ANALYSIS', 'THEORY', 180, '09:00–12:00 | Loop/recurrence analysis and worst-case space'),
  ('2026-10-04'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING-CONNECTED-COMPONENTS', 'MATH', 180, '14:00–17:00 | Connected components'),
  ('2026-10-04'::date, 3, 'GA', 'GA-S2-RATIOS', 'APTITUDE', 60, '17:15–18:15 | Ratios'),
  ('2026-10-05'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-SEARCHING-LINEAR-SEARCH', 'THEORY', 180, '09:00–12:00 | Searching — linear and binary'),
  ('2026-10-05'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING-MATCHING', 'MATH', 180, '14:00–17:00 | Matching'),
  ('2026-10-05'::date, 3, 'GA', 'GA-S2-PERCENTAGES', 'APTITUDE', 60, '17:15–18:15 | Percentages'),
  ('2026-10-06'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-SORTING-BUBBLE-SORT', 'THEORY', 180, '09:00–12:00 | Sorting I — bubble, selection, insertion, stability/in-place'),
  ('2026-10-06'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING-GRAPH-COLOURING', 'MATH', 120, '14:00–16:00 | Graph colouring'),
  ('2026-10-06'::date, 3, 'GA', 'GA-S2-POWERS', 'APTITUDE', 60, '16:15–17:15 | Powers'),
  ('2026-10-07'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-SORTING-MERGE-SORT', 'THEORY', 180, '09:00–12:00 | Sorting II — merge, quick, heap sort'),
  ('2026-10-07'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING', 'MATH', 120, '14:00–16:00 | Graph theory PYQs'),
  ('2026-10-07'::date, 3, 'GA', 'GA-S2-EXPONENTS-LOGARITHMS', 'APTITUDE', 60, '16:15–17:15 | Exponents and logarithms'),
  ('2026-10-08'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-HASHING-HASH-FUNCTIONS', 'THEORY', 180, '09:00–12:00 | Hashing — functions, collisions, chaining, open addressing, load factor'),
  ('2026-10-08'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS-BASIC-COUNTING-PRINCIPLES', 'MATH', 120, '14:00–16:00 | Counting principles'),
  ('2026-10-08'::date, 3, 'GA', 'GA-S2-PERMUTATIONS-COMBINATIONS', 'APTITUDE', 60, '16:15–17:15 | Permutations and combinations'),
  ('2026-10-09'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-DIVIDE-CONQUER-DIVIDE-CONQUER-COMBINE', 'THEORY', 180, '09:00–12:00 | Divide-and-conquer and recurrence analysis'),
  ('2026-10-09'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS-PERMUTATIONS-AND-COMBINATIONS', 'MATH', 120, '14:00–16:00 | Permutations and combinations'),
  ('2026-10-09'::date, 3, 'GA', 'GA-S2-SERIES', 'APTITUDE', 60, '16:15–17:15 | Series'),
  ('2026-10-10'::date, 1, 'CS-S5-ALGORITHMS', 'CS-S5-GREEDY', 'THEORY', 180, '09:00–12:00 | Greedy algorithms'),
  ('2026-10-10'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS-INCLUSION-EXCLUSION', 'MATH', 180, '14:00–17:00 | Inclusion-exclusion and counting techniques'),
  ('2026-10-10'::date, 3, 'GA', 'PREP-G27-GA-S2-MENSURATION-GEOMETRY-2D-MENSURATION', 'APTITUDE', 60, '17:15–18:15 | Mensuration'),
  ('2026-10-11'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-DYNAMIC-PROGRAMMING-OPTIMAL-SUBSTRUCTURE', 'THEORY', 180, '09:00–12:00 | DP I — optimal substructure, overlapping subproblems, memoization'),
  ('2026-10-11'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS-RECURRENCE-FORMULATION', 'MATH', 180, '14:00–17:00 | Recurrence formulation'),
  ('2026-10-11'::date, 3, 'GA', 'PREP-G27-GA-S2-MENSURATION-GEOMETRY-GEOMETRY-FUNDAMENTALS', 'APTITUDE', 60, '17:15–18:15 | Geometry'),
  ('2026-10-12'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-DYNAMIC-PROGRAMMING-DP-STATE-AND-TRANSITION-DESIGN', 'THEORY', 180, '09:00–12:00 | DP II — tabulation and state/transition design'),
  ('2026-10-12'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS-SOLVING-RECURRENCE-RELATIONS', 'MATH', 180, '14:00–17:00 | Solving recurrences'),
  ('2026-10-12'::date, 3, 'GA', 'PREP-G27-GA-S2-ELEMENTARY-STATISTICS-PROBABILITY-ELEMENTARY-STATISTICS', 'APTITUDE', 60, '17:15–18:15 | Elementary statistics'),
  ('2026-10-13'::date, 1, 'CS-S5-ALGORITHMS', 'PREP-G27-CS-S5-GRAPH-TRAVERSALS-BFS', 'THEORY', 180, '09:00–12:00 | Graph traversals — BFS and DFS'),
  ('2026-10-13'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS-GENERATING-FUNCTIONS', 'MATH', 120, '14:00–16:00 | Generating functions'),
  ('2026-10-13'::date, 3, 'GA', 'PREP-G27-GA-S2-ELEMENTARY-STATISTICS-PROBABILITY-ELEMENTARY-PROBABILITY', 'APTITUDE', 60, '16:15–17:15 | Elementary probability'),
  ('2026-10-14'::date, 1, 'CS-S5-ALGORITHMS', 'CS-S5-MINIMUM-SPANNING-TREES', 'THEORY', 180, '09:00–12:00 | MST and shortest paths — Prim, Kruskal, Dijkstra, Bellman-Ford foundations'),
  ('2026-10-14'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS', 'MATH', 120, '14:00–16:00 | Combinatorics PYQs'),
  ('2026-10-14'::date, 3, 'GA', 'GA-S3-LOGIC-DEDUCTION-INDUCTION', 'APTITUDE', 60, '16:15–17:15 | Logic — deduction'),
  ('2026-10-15'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-BOOLEAN-ALGEBRA-MINIMIZATION-BOOLEAN-LAWS-AND-IDENTITIES', 'THEORY', 180, '09:00–12:00 | Boolean laws, expressions, SOP/POS, minterms/maxterms'),
  ('2026-10-15'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'MATH', 120, '14:00–16:00 | Discrete Math full revision/test'),
  ('2026-10-15'::date, 3, 'GA', 'GA-S3-LOGIC-DEDUCTION-INDUCTION', 'APTITUDE', 60, '16:15–17:15 | Logic — induction'),
  ('2026-10-16'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-ALGEBRAIC-TECHNIQUE-ALGEBRAIC-MINIMIZATION', 'THEORY', 180, '09:00–12:00 | Algebraic minimization and 2/3-variable K-map'),
  ('2026-10-16'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LA-MATRICES', 'MATH', 120, '14:00–16:00 | Matrices — types and operations'),
  ('2026-10-16'::date, 3, 'GA', 'GA-S3-ANALOGY', 'APTITUDE', 60, '16:15–17:15 | Analogy'),
  ('2026-10-17'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-KARNAUGH-MAP-4-VARIABLE-K-MAP', 'THEORY', 180, '09:00–12:00 | 4-variable K-map, don''t-cares, tabular/Quine-McCluskey foundations'),
  ('2026-10-17'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-MATRICES-TRANSPOSE', 'MATH', 180, '14:00–17:00 | Transpose and matrix properties'),
  ('2026-10-17'::date, 3, 'GA', 'GA-S3-NUMERICAL-RELATIONS-REASONING', 'APTITUDE', 60, '17:15–18:15 | Numerical relations/reasoning'),
  ('2026-10-18'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-COMBINATIONAL-CIRCUITS-ADDERS', 'THEORY', 180, '09:00–12:00 | Combinational circuits I — adders, subtractors, comparators'),
  ('2026-10-18'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-MATRICES-INVERSE', 'MATH', 180, '14:00–17:00 | Matrix inverse'),
  ('2026-10-18'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial overview'),
  ('2026-10-19'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-COMBINATIONAL-CIRCUITS-MULTIPLEXERS', 'THEORY', 180, '09:00–12:00 | Combinational circuits II — mux/demux, encoders/decoders'),
  ('2026-10-19'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-MATRICES-ELEMENTARY-ROW-OPERATIONS', 'MATH', 180, '14:00–17:00 | Elementary row operations'),
  ('2026-10-19'::date, 3, 'GA', 'GA-S4-TRANSLATION', 'APTITUDE', 60, '17:15–18:15 | Translation and rotation'),
  ('2026-10-20'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-SEQUENTIAL-CIRCUITS-LATCHES', 'THEORY', 180, '09:00–12:00 | Sequential circuits I — latches and flip-flops'),
  ('2026-10-20'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-MATRICES-RANK', 'MATH', 180, '14:00–17:00 | Rank'),
  ('2026-10-20'::date, 3, 'GA', 'GA-S4-SCALING', 'APTITUDE', 60, '17:15–18:15 | Scaling and mirroring'),
  ('2026-10-21'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'PREP-G27-CS-S2-SEQUENTIAL-CIRCUITS-REGISTERS', 'THEORY', 180, '09:00–12:00 | Sequential circuits II — registers, counters, state analysis'),
  ('2026-10-21'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LA-MATRICES', 'MATH', 120, '14:00–16:00 | Matrix PYQs'),
  ('2026-10-21'::date, 3, 'GA', 'GA-S4-ASSEMBLING-GROUPING', 'APTITUDE', 60, '16:15–17:15 | Assembling/grouping and paper folding'),
  ('2026-10-22'::date, 1, 'CS-S2-DIGITAL-LOGIC', 'CS-S2-FIXED-POINT-REPRESENTATION-ARITHMETIC', 'THEORY', 180, '09:00–12:00 | Fixed/floating-point representation, complements, overflow, normalization'),
  ('2026-10-22'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-DETERMINANTS-DETERMINANT-EVALUATION', 'MATH', 120, '14:00–16:00 | Determinant evaluation'),
  ('2026-10-22'::date, 3, 'GA', 'GA-S4-PAPER-CUTTING', 'APTITUDE', 60, '16:15–17:15 | Paper cutting and 2D/3D patterns'),
  ('2026-10-23'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'PREP-G27-CS-S3-INSTRUCTION-SET-INSTRUCTION-FORMATS', 'THEORY', 180, '09:00–12:00 | Instruction set, instruction formats, execution'),
  ('2026-10-23'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-DETERMINANTS-DETERMINANT-PROPERTIES', 'MATH', 120, '14:00–16:00 | Determinant properties'),
  ('2026-10-23'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA timed set'),
  ('2026-10-24'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-ADDRESSING-MODES', 'THEORY', 180, '09:00–12:00 | Addressing modes'),
  ('2026-10-24'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LA-DETERMINANTS', 'MATH', 180, '14:00–17:00 | Determinant PYQs'),
  ('2026-10-24'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant speed practice'),
  ('2026-10-25'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-ALU', 'THEORY', 180, '09:00–12:00 | ALU design'),
  ('2026-10-25'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LA-LINEAR-EQUATIONS', 'MATH', 180, '14:00–17:00 | Linear equations — setup'),
  ('2026-10-25'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal practice'),
  ('2026-10-26'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-HARDWIRED-CONTROL', 'THEORY', 180, '09:00–12:00 | Hardwired control'),
  ('2026-10-26'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-LINEAR-EQUATIONS-GAUSSIAN-ELIMINATION', 'MATH', 180, '14:00–17:00 | Gaussian elimination'),
  ('2026-10-26'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA mini-test and error log'),
  ('2026-10-27'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'PREP-G27-CS-S3-MICROPROGRAMMED-CONTROL-MICROINSTRUCTIONS', 'THEORY', 180, '09:00–12:00 | Microprogrammed control, microinstructions, control memory'),
  ('2026-10-27'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-LINEAR-EQUATIONS-CONSISTENCY-OF-LINEAR-SYSTEMS', 'MATH', 120, '14:00–16:00 | Consistency of systems'),
  ('2026-10-27'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-10-28'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-MEMORY-INTERFACING', 'THEORY', 180, '09:00–12:00 | Memory interfacing'),
  ('2026-10-28'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-LINEAR-EQUATIONS-NUMBER-AND-NATURE-OF-SOLUTIONS', 'MATH', 120, '14:00–16:00 | Number/nature of solutions'),
  ('2026-10-28'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-10-29'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-MEMORY-HIERARCHY-PERFORMANCE', 'THEORY', 180, '09:00–12:00 | Memory hierarchy, locality, performance, AMAT'),
  ('2026-10-29'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LA-LINEAR-EQUATIONS', 'MATH', 120, '14:00–16:00 | Linear-equation PYQs'),
  ('2026-10-29'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-10-30'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'PREP-G27-CS-S3-CACHE-MEMORY-MAPPING-DIRECT-MAPPING', 'THEORY', 180, '09:00–12:00 | Cache I — direct and fully associative'),
  ('2026-10-30'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-EIGENVALUES-EIGENVECTORS-CHARACTERISTIC-EQUATION', 'MATH', 120, '14:00–16:00 | Characteristic equation'),
  ('2026-10-30'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed timed GA'),
  ('2026-10-31'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'PREP-G27-CS-S3-CACHE-MEMORY-MAPPING-SET-ASSOCIATIVE-MAPPING', 'THEORY', 180, '09:00–12:00 | Cache II — set associative, replacement, write policies'),
  ('2026-10-31'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-EIGENVALUES-EIGENVECTORS-EIGENVALUES', 'MATH', 180, '14:00–17:00 | Eigenvalues'),
  ('2026-10-31'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant speed'),
  ('2026-11-01'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-IO-INTERFACE', 'THEORY', 180, '09:00–12:00 | I/O, interrupts and DMA'),
  ('2026-11-01'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-EIGENVALUES-EIGENVECTORS-EIGENVECTORS', 'MATH', 180, '14:00–17:00 | Eigenvectors'),
  ('2026-11-01'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-11-02'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'PREP-G27-CS-S3-INSTRUCTION-PIPELINING-PIPELINE-STAGES', 'THEORY', 180, '09:00–12:00 | Instruction pipelining — stages, throughput, speedup'),
  ('2026-11-02'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-EIGENVALUES-EIGENVECTORS-EIGENVALUE-EIGENVECTOR-PROPERTIES', 'MATH', 180, '14:00–17:00 | Eigenvalue/eigenvector properties'),
  ('2026-11-02'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-11-03'::date, 1, 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'PREP-G27-CS-S3-PIPELINE-HAZARDS-STRUCTURAL-HAZARDS', 'THEORY', 180, '09:00–12:00 | Pipeline hazards — structural/data/control, stalls, forwarding + COA PYQs'),
  ('2026-11-03'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LA-EIGENVALUES-EIGENVECTORS', 'MATH', 120, '14:00–16:00 | Eigen PYQs'),
  ('2026-11-03'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-11-04'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-SYSTEM-CALLS-SYSTEM-CALL-TYPES-AND-USE', 'THEORY', 180, '09:00–12:00 | System calls, process model, states, PCB, context switching'),
  ('2026-11-04'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-LU-DECOMPOSITION-LU-FACTORIZATION', 'MATH', 120, '14:00–16:00 | LU factorization'),
  ('2026-11-04'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-11-05'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-PROCESSES-PROCESS-CREATION-FOUNDATIONS', 'THEORY', 180, '09:00–12:00 | Process creation/termination and threads'),
  ('2026-11-05'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-LA-LU-DECOMPOSITION-SOLVING-SYSTEMS-USING-LU', 'MATH', 120, '14:00–16:00 | Solving systems with LU'),
  ('2026-11-05'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-11-06'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-INTER-PROCESS-COMMUNICATION-SHARED-MEMORY', 'THEORY', 180, '09:00–12:00 | IPC — shared memory, message passing, pipes'),
  ('2026-11-06'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'MATH', 120, '14:00–16:00 | Linear Algebra mixed PYQs'),
  ('2026-11-06'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-11-07'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-CONCURRENCY-RACE-CONDITIONS', 'THEORY', 180, '09:00–12:00 | Concurrency, race conditions, critical section'),
  ('2026-11-07'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'MATH', 180, '14:00–17:00 | Linear Algebra full test/error repair'),
  ('2026-11-07'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-11-08'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-SYNCHRONIZATION-MUTEX', 'THEORY', 180, '09:00–12:00 | Synchronization I — mutex and semaphore'),
  ('2026-11-08'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'MATH', 180, '14:00–17:00 | Calculus overview and prerequisites'),
  ('2026-11-08'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-11-09'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-SYNCHRONIZATION-MONITOR-FOUNDATIONS', 'THEORY', 180, '09:00–12:00 | Synchronization II — monitors and classical problems'),
  ('2026-11-09'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY-STANDARD-LIMITS', 'MATH', 180, '14:00–17:00 | Standard limits'),
  ('2026-11-09'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-11-10'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-DEADLOCK-DEADLOCK-NECESSARY-CONDITIONS', 'THEORY', 180, '09:00–12:00 | Deadlock I — conditions and resource-allocation graphs'),
  ('2026-11-10'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY-LIMIT-EVALUATION', 'MATH', 120, '14:00–16:00 | Limit evaluation'),
  ('2026-11-10'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-11-11'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-DEADLOCK-DEADLOCK-PREVENTION', 'THEORY', 180, '09:00–12:00 | Deadlock II — prevention, avoidance, detection'),
  ('2026-11-11'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY', 'MATH', 120, '14:00–16:00 | Limits PYQs'),
  ('2026-11-11'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-11-12'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-CPU-SCHEDULING-FCFS', 'THEORY', 180, '09:00–12:00 | CPU scheduling — FCFS, SJF/SRTF, priority, RR'),
  ('2026-11-12'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY-CONTINUITY-CONDITIONS', 'MATH', 120, '14:00–16:00 | Continuity conditions'),
  ('2026-11-12'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-11-13'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'CS-S8-IO-SCHEDULING', 'THEORY', 180, '09:00–12:00 | I/O and disk scheduling'),
  ('2026-11-13'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY-CONTINUITY-CONDITIONS', 'MATH', 120, '14:00–16:00 | Continuity problems'),
  ('2026-11-13'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-11-14'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-MEMORY-MANAGEMENT-CONTIGUOUS-ALLOCATION', 'THEORY', 180, '09:00–12:00 | Memory management — contiguous, paging, segmentation'),
  ('2026-11-14'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY-DIFFERENTIABILITY-CONDITIONS', 'MATH', 180, '14:00–17:00 | Differentiability basics'),
  ('2026-11-14'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-11-15'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-VIRTUAL-MEMORY-DEMAND-PAGING', 'THEORY', 180, '09:00–12:00 | Virtual memory — demand paging, replacement, TLB, thrashing'),
  ('2026-11-15'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY-DIFFERENTIABILITY-CONDITIONS', 'MATH', 180, '14:00–17:00 | Differentiability problems'),
  ('2026-11-15'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-11-16'::date, 1, 'CS-S8-OPERATING-SYSTEM', 'PREP-G27-CS-S8-FILE-SYSTEMS-DIRECTORY-STRUCTURES', 'THEORY', 180, '09:00–12:00 | File systems — directories, allocation, free space + OS PYQs'),
  ('2026-11-16'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY', 'MATH', 180, '14:00–17:00 | Limits/continuity/differentiability mixed'),
  ('2026-11-16'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-11-17'::date, 1, 'CS-S9-DATABASES', 'CS-S9-ER-MODEL', 'THEORY', 180, '09:00–12:00 | ER model'),
  ('2026-11-17'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-MAXIMA-MINIMA-CRITICAL-POINTS', 'MATH', 120, '14:00–16:00 | Critical points'),
  ('2026-11-17'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-11-18'::date, 1, 'CS-S9-DATABASES', 'CS-S9-RELATIONAL-MODEL', 'THEORY', 180, '09:00–12:00 | Relational model, schemas, keys'),
  ('2026-11-18'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-MAXIMA-MINIMA-FIRST-DERIVATIVE-TEST', 'MATH', 120, '14:00–16:00 | First-derivative test'),
  ('2026-11-18'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-11-19'::date, 1, 'CS-S9-DATABASES', 'CS-S9-RELATIONAL-ALGEBRA', 'THEORY', 180, '09:00–12:00 | Relational Algebra I'),
  ('2026-11-19'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-MAXIMA-MINIMA-SECOND-DERIVATIVE-TEST', 'MATH', 120, '14:00–16:00 | Second-derivative test'),
  ('2026-11-19'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-11-20'::date, 1, 'CS-S9-DATABASES', 'CS-S9-RELATIONAL-ALGEBRA', 'THEORY', 180, '09:00–12:00 | Relational Algebra II and tuple calculus'),
  ('2026-11-20'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CA-MAXIMA-MINIMA', 'MATH', 120, '14:00–16:00 | Maxima/minima PYQs'),
  ('2026-11-20'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-11-21'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-SQL-BASIC-SQL-QUERIES', 'THEORY', 180, '09:00–12:00 | SQL I — basic queries and joins'),
  ('2026-11-21'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-MEAN-VALUE-THEOREM-ROLLE-THEOREM-FOUNDATIONS', 'MATH', 180, '14:00–17:00 | Rolle theorem foundations'),
  ('2026-11-21'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-11-22'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-SQL-NESTED-QUERIES', 'THEORY', 180, '09:00–12:00 | SQL II — nested queries, aggregation, GROUP BY, HAVING'),
  ('2026-11-22'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CA-MEAN-VALUE-THEOREM', 'MATH', 180, '14:00–17:00 | Mean Value Theorem'),
  ('2026-11-22'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-11-23'::date, 1, 'CS-S9-DATABASES', 'CS-S9-INTEGRITY-CONSTRAINTS', 'THEORY', 180, '09:00–12:00 | Integrity constraints + functional dependencies, closure, candidate keys'),
  ('2026-11-23'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CA-MEAN-VALUE-THEOREM', 'MATH', 180, '14:00–17:00 | MVT PYQs'),
  ('2026-11-23'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-11-24'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-NORMAL-FORMS-1NF', 'THEORY', 180, '09:00–12:00 | Normalization I — 1NF/2NF/3NF'),
  ('2026-11-24'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-INTEGRATION-BASIC-INTEGRATION', 'MATH', 120, '14:00–16:00 | Basic integration'),
  ('2026-11-24'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-11-25'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-NORMAL-FORMS-BCNF', 'THEORY', 180, '09:00–12:00 | Normalization II — BCNF, decomposition, lossless, dependency preservation'),
  ('2026-11-25'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-INTEGRATION-DEFINITE-INTEGRATION', 'MATH', 120, '14:00–16:00 | Definite integration'),
  ('2026-11-25'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-11-26'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-FILE-ORGANIZATION-FILE-ORGANIZATION-FOUNDATIONS', 'THEORY', 180, '09:00–12:00 | File organization and indexing'),
  ('2026-11-26'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-CA-INTEGRATION-PROPERTIES-OF-DEFINITE-INTEGRALS', 'MATH', 120, '14:00–16:00 | Properties of definite integrals'),
  ('2026-11-26'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-11-27'::date, 1, 'CS-S9-DATABASES', 'CS-S9-B-TREES', 'THEORY', 180, '09:00–12:00 | B-tree and B+ tree'),
  ('2026-11-27'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CA-INTEGRATION', 'MATH', 120, '14:00–16:00 | Integration PYQs'),
  ('2026-11-27'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-11-28'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-TRANSACTIONS-ACID', 'THEORY', 180, '09:00–12:00 | Transactions — ACID, schedules, states'),
  ('2026-11-28'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'MATH', 180, '14:00–17:00 | Calculus full test/error repair'),
  ('2026-11-28'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-11-29'::date, 1, 'CS-S9-DATABASES', 'PREP-G27-CS-S9-CONCURRENCY-CONTROL-SERIALIZABILITY', 'THEORY', 180, '09:00–12:00 | Concurrency control — serializability, locks, 2PL, timestamps + DBMS PYQs'),
  ('2026-11-29'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'MATH', 180, '14:00–17:00 | Probability — sample space/events/rules'),
  ('2026-11-29'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-11-30'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'PREP-G27-CS-S10-PRINCIPLES-LAYERING-SERVICES-PROTOCOLS-AND-INTERFACES', 'THEORY', 180, '09:00–12:00 | Layering — services, protocols, interfaces, encapsulation, TCP/IP/OSI'),
  ('2026-11-30'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-RANDOM-VARIABLES', 'MATH', 180, '14:00–17:00 | Random variables — discrete/continuous'),
  ('2026-11-30'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-12-01'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-CIRCUIT-SWITCHING', 'THEORY', 180, '09:00–12:00 | Circuit/packet/virtual-circuit switching + performance'),
  ('2026-12-01'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-RANDOM-VARIABLES-PMF-FOUNDATIONS', 'MATH', 120, '14:00–16:00 | PMF/PDF/CDF foundations'),
  ('2026-12-01'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-12-02'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'PREP-G27-CS-S10-ERROR-DETECTION-PARITY-FOUNDATIONS', 'THEORY', 180, '09:00–12:00 | Error detection — parity/checksum foundations and CRC'),
  ('2026-12-02'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-RANDOM-VARIABLES-EXPECTATION', 'MATH', 120, '14:00–16:00 | Expectation and variance foundations'),
  ('2026-12-02'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-12-03'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-MEDIUM-ACCESS-CONTROL', 'THEORY', 180, '09:00–12:00 | MAC and Ethernet; ALOHA/CSMA foundations'),
  ('2026-12-03'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-RANDOM-VARIABLES', 'MATH', 120, '14:00–16:00 | Random-variable PYQs'),
  ('2026-12-03'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-12-04'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-DISTANCE-VECTOR-ROUTING', 'THEORY', 180, '09:00–12:00 | Distance-vector routing and Bellman-Ford principle'),
  ('2026-12-04'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DISTRIBUTIONS-UNIFORM-DISTRIBUTION', 'MATH', 120, '14:00–16:00 | Uniform distribution'),
  ('2026-12-04'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-12-05'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-LINK-STATE-ROUTING', 'THEORY', 180, '09:00–12:00 | Link-state routing and Dijkstra'),
  ('2026-12-05'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DISTRIBUTIONS-BINOMIAL-DISTRIBUTION', 'MATH', 180, '14:00–17:00 | Binomial distribution'),
  ('2026-12-05'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-12-06'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'PREP-G27-CS-S10-IPV4-FRAGMENTATION-IPV4-FRAGMENTATION-CALCULATIONS', 'THEORY', 180, '09:00–12:00 | IPv4 fragmentation, MTU, fields and calculations'),
  ('2026-12-06'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DISTRIBUTIONS-POISSON-DISTRIBUTION', 'MATH', 180, '14:00–17:00 | Poisson distribution'),
  ('2026-12-06'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-12-07'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'PREP-G27-CS-S10-CIDR-NOTATION-IPV4-ADDRESSING-FOUNDATIONS', 'THEORY', 180, '09:00–12:00 | CIDR I — addressing, prefixes, subnet basics'),
  ('2026-12-07'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DISTRIBUTIONS-NORMAL-DISTRIBUTION', 'MATH', 180, '14:00–17:00 | Normal distribution'),
  ('2026-12-07'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-12-08'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'PREP-G27-CS-S10-CIDR-NOTATION-SUBNETTING', 'THEORY', 180, '09:00–12:00 | CIDR II — subnetting and address blocks'),
  ('2026-12-08'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DISTRIBUTIONS-EXPONENTIAL-DISTRIBUTION', 'MATH', 120, '14:00–16:00 | Exponential distribution'),
  ('2026-12-08'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-12-09'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'PREP-G27-CS-S10-NETWORK-ADDRESS-TRANSLATION-NAT-FUNDAMENTALS', 'THEORY', 180, '09:00–12:00 | NAT'),
  ('2026-12-09'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DISTRIBUTIONS-MIXED-DISTRIBUTION-PROBLEMS', 'MATH', 120, '14:00–16:00 | Mixed distribution problems'),
  ('2026-12-09'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-12-10'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-TCP-FLOW-CONTROL', 'THEORY', 180, '09:00–12:00 | TCP flow control'),
  ('2026-12-10'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-DISTRIBUTIONS', 'MATH', 120, '14:00–16:00 | Distribution PYQs'),
  ('2026-12-10'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-12-11'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-TCP-CONGESTION-CONTROL', 'THEORY', 180, '09:00–12:00 | TCP congestion control'),
  ('2026-12-11'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DESCRIPTIVE-STATISTICS-MEAN', 'MATH', 120, '14:00–16:00 | Mean, median, mode'),
  ('2026-12-11'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-12-12'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-SOCKET-API', 'THEORY', 180, '09:00–12:00 | Socket API'),
  ('2026-12-12'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-DESCRIPTIVE-STATISTICS-VARIANCE', 'MATH', 180, '14:00–17:00 | Variance and standard deviation'),
  ('2026-12-12'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-12-13'::date, 1, 'CS-S10-COMPUTER-NETWORKS', 'CS-S10-DNS', 'THEORY', 180, '09:00–12:00 | DNS + HTTP + CN mixed PYQs'),
  ('2026-12-13'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-DESCRIPTIVE-STATISTICS', 'MATH', 180, '14:00–17:00 | Descriptive-statistics PYQs'),
  ('2026-12-13'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-12-14'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'CS-S6-REGULAR-EXPRESSIONS', 'THEORY', 180, '09:00–12:00 | Regular expressions'),
  ('2026-12-14'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-CONDITIONAL-PROBABILITY-BAYES', 'MATH', 180, '14:00–17:00 | Conditional probability basics'),
  ('2026-12-14'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-12-15'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-FINITE-AUTOMATA-DFA', 'THEORY', 180, '09:00–12:00 | DFA, NFA and epsilon-NFA'),
  ('2026-12-15'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-CONDITIONAL-PROBABILITY-BAYES', 'MATH', 120, '14:00–16:00 | Total probability and conditional rules'),
  ('2026-12-15'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-12-16'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-FINITE-AUTOMATA-NFA-TO-DFA-CONVERSION', 'THEORY', 180, '09:00–12:00 | Automata conversion, minimization, equivalence'),
  ('2026-12-16'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'PREP-G27-CS-S1-PS-CONDITIONAL-PROBABILITY-BAYES-BAYES-THEOREM', 'MATH', 120, '14:00–16:00 | Bayes theorem'),
  ('2026-12-16'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-12-17'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-CONTEXT-FREE-GRAMMARS-PRODUCTIONS', 'THEORY', 180, '09:00–12:00 | CFG — production, derivation, parse trees, ambiguity'),
  ('2026-12-17'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PS-CONDITIONAL-PROBABILITY-BAYES', 'MATH', 120, '14:00–16:00 | Conditional/Bayes problems'),
  ('2026-12-17'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-12-18'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-PUSH-DOWN-AUTOMATA-PDA-OPERATION', 'THEORY', 180, '09:00–12:00 | PDA — operation, construction, acceptance'),
  ('2026-12-18'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'MATH', 120, '14:00–16:00 | Probability/Statistics mixed PYQs'),
  ('2026-12-18'::date, 3, 'GA', null, 'APTITUDE', 60, '16:15–17:15 | Mixed GA'),
  ('2026-12-19'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-REGULAR-LANGUAGES-REGULAR-LANGUAGE-CLOSURE-PROPERTIES', 'THEORY', 180, '09:00–12:00 | Regular languages — closure and decision foundations'),
  ('2026-12-19'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'MATH', 180, '14:00–17:00 | Probability and Statistics full test'),
  ('2026-12-19'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-12-20'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-CONTEXT-FREE-LANGUAGES-CFL-PROPERTIES', 'THEORY', 180, '09:00–12:00 | Context-free languages — properties and closure'),
  ('2026-12-20'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'MATH', 180, '14:00–17:00 | Probability error repair and formulas'),
  ('2026-12-20'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-12-21'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'PREP-G27-CS-S6-PUMPING-LEMMA-PUMPING-LEMMA-FOR-REGULAR-LANGUAGES', 'THEORY', 180, '09:00–12:00 | Pumping lemma — regular and CFL'),
  ('2026-12-21'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'MATH', 180, '14:00–17:00 | Revision — Discrete logic/sets/relations/functions'),
  ('2026-12-21'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-12-22'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'CS-S6-TURING-MACHINES', 'THEORY', 180, '09:00–12:00 | Turing machines'),
  ('2026-12-22'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'MATH', 120, '14:00–16:00 | Revision — posets/groups/graphs/combinatorics'),
  ('2026-12-22'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-12-23'::date, 1, 'CS-S6-THEORY-COMPUTATION', 'CS-S6-UNDECIDABILITY', 'THEORY', 180, '09:00–12:00 | Undecidability, reductions, halting reasoning + TOC PYQs'),
  ('2026-12-23'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'MATH', 120, '14:00–16:00 | Revision — matrices/determinants/linear systems'),
  ('2026-12-23'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-12-24'::date, 1, 'CS-S7-COMPILER-DESIGN', 'CS-S7-LEXICAL-ANALYSIS', 'THEORY', 180, '09:00–12:00 | Lexical analysis — tokens, lexemes, patterns, regex/automata'),
  ('2026-12-24'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'MATH', 120, '14:00–16:00 | Revision — eigenvalues/eigenvectors/LU'),
  ('2026-12-24'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs'),
  ('2026-12-25'::date, 1, 'CS-S7-COMPILER-DESIGN', 'PREP-G27-CS-S7-PARSING-FIRST', 'THEORY', 180, '09:00–12:00 | Parsing I — FIRST/FOLLOW, top-down, LL(1)'),
  ('2026-12-25'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'MATH', 180, '14:00–17:00 | Revision — limits/continuity/differentiability'),
  ('2026-12-25'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Mixed GA'),
  ('2026-12-26'::date, 1, 'CS-S7-COMPILER-DESIGN', 'PREP-G27-CS-S7-PARSING-LR-0', 'THEORY', 180, '09:00–12:00 | Parsing II — LR(0), SLR, CLR, LALR, shift/reduce'),
  ('2026-12-26'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'MATH', 180, '14:00–17:00 | Revision — extrema, MVT, integration'),
  ('2026-12-26'::date, 3, 'GA', 'GA-S2-DATA-INTERPRETATION', 'APTITUDE', 60, '17:15–18:15 | DI and Quant'),
  ('2026-12-27'::date, 1, 'CS-S7-COMPILER-DESIGN', 'CS-S7-SYNTAX-DIRECTED-TRANSLATION', 'THEORY', 180, '09:00–12:00 | Syntax-directed translation, SDDs, attributes'),
  ('2026-12-27'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'MATH', 180, '14:00–17:00 | Revision — random variables and distributions'),
  ('2026-12-27'::date, 3, 'GA', 'GA-S4-SPATIAL-APTITUDE', 'APTITUDE', 60, '17:15–18:15 | Spatial and Verbal'),
  ('2026-12-28'::date, 1, 'CS-S7-COMPILER-DESIGN', 'PREP-G27-CS-S7-RUNTIME-ENVIRONMENTS-ACTIVATION-RECORDS', 'THEORY', 180, '09:00–12:00 | Runtime environments, activation records, storage allocation'),
  ('2026-12-28'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'MATH', 180, '14:00–17:00 | Revision — statistics, conditional probability and Bayes'),
  ('2026-12-28'::date, 3, 'GA', null, 'APTITUDE', 60, '17:15–18:15 | Weekly GA test'),
  ('2026-12-29'::date, 1, 'CS-S7-COMPILER-DESIGN', 'PREP-G27-CS-S7-INTERMEDIATE-CODE-GENERATION-THREE-ADDRESS-CODE', 'THEORY', 180, '09:00–12:00 | Intermediate code — TAC, quadruples, triples'),
  ('2026-12-29'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', null, 'MATH', 120, '14:00–16:00 | Math mixed PYQ test 1'),
  ('2026-12-29'::date, 3, 'GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Quant PYQs'),
  ('2026-12-30'::date, 1, 'CS-S7-COMPILER-DESIGN', 'PREP-G27-CS-S7-LOCAL-OPTIMISATION-BASIC-BLOCKS', 'THEORY', 180, '09:00–12:00 | Local optimisation, basic blocks and constant propagation'),
  ('2026-12-30'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', null, 'MATH', 120, '14:00–16:00 | Math mixed PYQ test 2'),
  ('2026-12-30'::date, 3, 'GA', 'GA-S1-VERBAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Verbal PYQs'),
  ('2026-12-31'::date, 1, 'CS-S7-COMPILER-DESIGN', 'PREP-G27-CS-S7-LIVENESS-ANALYSIS-LIVENESS-FUNDAMENTALS', 'THEORY', 180, '09:00–12:00 | Liveness analysis + common-subexpression elimination + final Compiler mixed PYQs'),
  ('2026-12-31'::date, 2, 'CS-S1-ENGINEERING-MATHEMATICS', null, 'MATH', 120, '14:00–16:00 | Final Math formula sheet + weak-topic repair'),
  ('2026-12-31'::date, 3, 'GA', 'GA-S3-ANALYTICAL-APTITUDE', 'APTITUDE', 60, '16:15–17:15 | Analytical PYQs');

do $$
declare
  final_key constant text := 'GATE2027_FIRST_PASS_20260911_20261231_V1';
  final_count integer;
  target_count integer;
  legacy_dates integer;
  unsafe_used_count integer;
begin
  if (select count(*) from _plan_manifest) <> 336
     or (select count(distinct task_date) from _plan_manifest) <> 112
     or (select min(task_date) from _plan_manifest) <> date '2026-09-11'
     or (select max(task_date) from _plan_manifest) <> date '2026-12-31' then raise exception 'Frozen plan manifest date/count invariant failed'; end if;
  if exists (select task_date from _plan_manifest group by task_date having count(*) <> 3 or min(plan_slot) <> 1 or max(plan_slot) <> 3 or count(distinct plan_slot) <> 3) then raise exception 'Frozen plan slot invariant failed'; end if;
  if (select coalesce(sum(planned_minutes), 0) from _plan_manifest where plan_slot = 1) <> 20160
     or (select coalesce(sum(planned_minutes), 0) from _plan_manifest where plan_slot = 2) <> 16500
     or (select coalesce(sum(planned_minutes), 0) from _plan_manifest where plan_slot = 3) <> 6720
     or (select coalesce(sum(planned_minutes), 0) from _plan_manifest) <> 43380 then raise exception 'Frozen plan minute totals failed'; end if;
  if exists (
    select 1 from _plan_manifest plan
    left join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
    left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code
    where subject.id is null or (plan.topic_code is not null and (topic.id is null or topic.subject_id <> subject.id))
  ) then raise exception 'Frozen plan contains an unresolved or cross-subject topic'; end if;
  if exists (select 1 from public.daily_tasks where plan_key is not null and plan_key <> final_key and task_date between date '2026-09-11' and date '2026-12-31') then raise exception 'Unexpected plan key exists in the target window'; end if;

  select count(*) into final_count from public.daily_tasks where plan_key = final_key;
  select count(*) into target_count from public.daily_tasks where task_date between date '2026-09-11' and date '2026-12-31';

  if final_count = 336 then
    if exists (
      select 1 from public.daily_tasks task
      join _plan_manifest plan on plan.task_date = task.task_date and plan.plan_slot = task.plan_slot
      join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
      left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code
      where task.plan_key = final_key and (task.subject_id is distinct from subject.id or task.topic_id is distinct from topic.id
        or task.task_type is distinct from plan.task_type or task.planned_minutes is distinct from plan.planned_minutes or task.notes is distinct from plan.notes)
    ) or (select count(*) from public.daily_tasks task join _plan_manifest plan on plan.task_date = task.task_date and plan.plan_slot = task.plan_slot where task.plan_key = final_key) <> 336
    then raise exception 'Existing final plan does not match the frozen manifest'; end if;
  elsif final_count <> 0 then
    raise exception 'Partial final plan detected: % of 336 rows', final_count;
  elsif target_count = 0 then
    insert into public.daily_tasks (task_date, subject_id, topic_id, task_type, planned_minutes, actual_minutes, status, started_at, completed_at, notes, plan_key, plan_slot)
    select plan.task_date, subject.id, topic.id, plan.task_type, plan.planned_minutes, null, 'TODO', null, null, plan.notes, final_key, plan.plan_slot
    from _plan_manifest plan
    join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
    left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code;
  elsif target_count = 312 then
    select count(distinct task_date) into legacy_dates from public.daily_tasks where task_date between date '2026-09-11' and date '2026-12-23';
    if legacy_dates <> 104
       or (select min(task_date) from public.daily_tasks where task_date between date '2026-09-11' and date '2026-12-31') <> date '2026-09-11'
       or (select max(task_date) from public.daily_tasks where task_date between date '2026-09-11' and date '2026-12-31') <> date '2026-12-23'
       or exists (
         select task_date from public.daily_tasks where task_date between date '2026-09-11' and date '2026-12-23'
         group by task_date having count(*) <> 3
           or count(*) filter (where task_type = 'MATH') <> 1
           or count(*) filter (where task_type = 'APTITUDE') <> 1
           or count(*) filter (where task_type not in ('MATH', 'APTITUDE')) <> 1
       ) then raise exception 'Unsupported or partial legacy plan shape'; end if;

    with recursive mapped as (
      select legacy.id, legacy.subject_id as old_subject_id, legacy.topic_id as old_topic_id,
        (legacy.status <> 'TODO' or legacy.actual_minutes is not null or legacy.started_at is not null or legacy.completed_at is not null) as used,
        plan.subject_code, plan.topic_code, subject.id as new_subject_id, topic.id as new_topic_id
      from public.daily_tasks legacy
      join _plan_manifest plan on plan.task_date = legacy.task_date and plan.plan_slot = case when legacy.task_type = 'MATH' then 2 when legacy.task_type = 'APTITUDE' then 3 else 1 end
      join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
      left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code
      where legacy.task_date between date '2026-09-11' and date '2026-12-23'
    ), ancestry as (
      select mapped.id as task_id, mapped.new_topic_id as topic_id
      from mapped where mapped.new_topic_id is not null
      union all
      select ancestry.task_id, topic.parent_topic_id
      from ancestry join public.topics topic on topic.id = ancestry.topic_id
      where topic.parent_topic_id is not null
    )
    select count(*) into unsafe_used_count from mapped
    where used and (old_subject_id is distinct from new_subject_id or old_topic_id is null or new_topic_id is null
      or not exists (select 1 from ancestry where ancestry.task_id = mapped.id and ancestry.topic_id = mapped.old_topic_id));
    if unsafe_used_count <> 0 then raise exception 'Used legacy task cannot be safely remapped: % row(s)', unsafe_used_count; end if;

    update public.daily_tasks legacy set
      subject_id = subject.id, topic_id = topic.id, task_type = plan.task_type, planned_minutes = plan.planned_minutes, notes = plan.notes, plan_key = final_key, plan_slot = plan.plan_slot
    from _plan_manifest plan
    join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
    left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code
    where legacy.task_date = plan.task_date
      and legacy.task_date between date '2026-09-11' and date '2026-12-23'
      and plan.plan_slot = case when legacy.task_type = 'MATH' then 2 when legacy.task_type = 'APTITUDE' then 3 else 1 end;

    insert into public.daily_tasks (task_date, subject_id, topic_id, task_type, planned_minutes, actual_minutes, status, started_at, completed_at, notes, plan_key, plan_slot)
    select plan.task_date, subject.id, topic.id, plan.task_type, plan.planned_minutes, null, 'TODO', null, null, plan.notes, final_key, plan.plan_slot
    from _plan_manifest plan
    join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
    left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code
    where plan.task_date between date '2026-12-24' and date '2026-12-31';
  else
    raise exception 'Unsupported planner state: % target-window rows', target_count;
  end if;

  if (select count(*) from public.daily_tasks where plan_key = final_key) <> 336
     or (select count(distinct task_date) from public.daily_tasks where plan_key = final_key) <> 112
     or (select min(task_date) from public.daily_tasks where plan_key = final_key) <> date '2026-09-11'
     or (select max(task_date) from public.daily_tasks where plan_key = final_key) <> date '2026-12-31' then raise exception 'Persisted plan date/count invariant failed'; end if;
  if exists (select task_date from public.daily_tasks where plan_key = final_key group by task_date having count(*) <> 3 or count(distinct plan_slot) <> 3 or min(plan_slot) <> 1 or max(plan_slot) <> 3) then raise exception 'Persisted plan slot invariant failed'; end if;
  if exists (
    select 1 from public.daily_tasks task join public.subjects subject on subject.id = task.subject_id
    where task.plan_key = final_key and case task.plan_slot
      when 1 then subject.source_paper_code <> 'CS' or subject.code in ('CS-S1-ENGINEERING-MATHEMATICS', 'GA')
      when 2 then subject.code <> 'CS-S1-ENGINEERING-MATHEMATICS'
      when 3 then subject.code <> 'GA'
      else true
    end
  ) then raise exception 'Persisted plan lane subject invariant failed'; end if;
  if (select coalesce(sum(planned_minutes), 0) from public.daily_tasks where plan_key = final_key and plan_slot = 1) <> 20160
     or (select coalesce(sum(planned_minutes), 0) from public.daily_tasks where plan_key = final_key and plan_slot = 2) <> 16500
     or (select coalesce(sum(planned_minutes), 0) from public.daily_tasks where plan_key = final_key and plan_slot = 3) <> 6720
     or (select coalesce(sum(planned_minutes), 0) from public.daily_tasks where plan_key = final_key) <> 43380 then raise exception 'Persisted plan minute totals failed'; end if;
  if exists (
    select 1 from public.daily_tasks task join public.topics topic on topic.id = task.topic_id
    where task.plan_key = final_key and topic.subject_id <> task.subject_id
  ) then raise exception 'Persisted plan topic/subject mismatch'; end if;
  if exists (
    select 1 from public.daily_tasks task join _plan_manifest plan on plan.task_date = task.task_date and plan.plan_slot = task.plan_slot
    join public.subjects subject on subject.syllabus_version = 'GATE_2027' and subject.code = plan.subject_code
    left join public.topics topic on topic.syllabus_version = 'GATE_2027' and topic.code = plan.topic_code
    where task.plan_key = final_key and (task.subject_id is distinct from subject.id or task.topic_id is distinct from topic.id
      or task.task_type is distinct from plan.task_type or task.planned_minutes is distinct from plan.planned_minutes or task.notes is distinct from plan.notes)
  ) then raise exception 'Persisted plan differs from the frozen manifest'; end if;
  if exists (
    select task_date from public.daily_tasks where plan_key = final_key
    group by task_date having sum(planned_minutes) <> case
      when extract(isodow from task_date) in (1, 6, 7) or task_date in (date '2026-10-02', date '2026-10-20', date '2026-12-25') then 420 else 360 end
  ) then raise exception 'Persisted daily duration template failed'; end if;
  if exists (select 1 from public.daily_tasks where plan_key = final_key and task_date not between date '2026-09-11' and date '2026-12-31') then raise exception 'Generated task exists outside the target window'; end if;
end
$$;

commit;

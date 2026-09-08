-- Official GATE 2027 syllabus seed for LAST CHANCE.
-- Authority: IIT Madras GATE 2027 official CS and GA syllabus PDFs.
-- Stable codes make this seed idempotent; mutable topic progress and app settings are preserved.

begin;

insert into public.app_settings (
  singleton_key, exam_name, exam_date, target_marks,
  weekday_study_hours, sunday_study_hours, monday_study_hours
) values ('default', 'GATE 2027 CS', null, 70, 3, 7, 7)
on conflict (singleton_key) do nothing;

with subject_seed (code, source_paper_code, official_section_number, name, display_order, source_url) as (
  values
    ('GA', 'GA', null, 'General Aptitude', 1, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/GA_GATE2027_Syllabus.pdf'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS', 1, 'Engineering Mathematics', 1, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S2-DIGITAL-LOGIC', 'CS', 2, 'Digital Logic', 2, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS', 3, 'Computer Organization and Architecture', 3, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS', 4, 'Programming and Data Structures', 4, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S5-ALGORITHMS', 'CS', 5, 'Algorithms', 5, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S6-THEORY-COMPUTATION', 'CS', 6, 'Theory of Computation', 6, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S7-COMPILER-DESIGN', 'CS', 7, 'Compiler Design', 7, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S8-OPERATING-SYSTEM', 'CS', 8, 'Operating System', 8, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S9-DATABASES', 'CS', 9, 'Databases', 9, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS', 10, 'Computer Networks', 10, 'https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/CS_GATE2027_Syllabus.pdf')
)
insert into public.subjects (
  code, syllabus_version, source_paper_code, official_section_number,
  name, display_order, is_official, source_url
)
select code, 'GATE_2027', source_paper_code, official_section_number,
  name, display_order, true, source_url
from subject_seed
on conflict (syllabus_version, code) do update set
  source_paper_code = excluded.source_paper_code,
  official_section_number = excluded.official_section_number,
  name = excluded.name,
  display_order = excluded.display_order,
  is_official = true,
  source_url = excluded.source_url,
  updated_at = now();

with root_topic_seed (subject_code, code, name, display_order, official_source_text) as (
  values
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'Discrete Mathematics', 1, 'Discrete Mathematics'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'Linear Algebra', 2, 'Linear Algebra'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'Calculus', 3, 'Calculus'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'Probability and Statistics', 4, 'Probability and Statistics'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-BOOLEAN-ALGEBRA-MINIMIZATION', 'Boolean algebra and minimization', 1, 'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method.'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-ALGEBRAIC-TECHNIQUE', 'Algebraic technique', 2, 'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method.'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-KARNAUGH-MAP', 'Karnaugh map', 3, 'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method.'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-TABULAR-METHOD', 'Tabular method', 4, 'Boolean algebra and minimization – algebraic technique, Karnaugh map, tabular method.'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-COMBINATIONAL-CIRCUITS', 'Design of combinational circuits', 5, 'Design of combinational and sequential circuits.'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-SEQUENTIAL-CIRCUITS', 'Design of sequential circuits', 6, 'Design of combinational and sequential circuits.'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-FIXED-POINT-REPRESENTATION-ARITHMETIC', 'Fixed-point number representation and arithmetic', 7, 'Number representation and arithmetic (fixed and floating point).'),
    ('CS-S2-DIGITAL-LOGIC', 'CS-S2-FLOATING-POINT-REPRESENTATION-ARITHMETIC', 'Floating-point number representation and arithmetic', 8, 'Number representation and arithmetic (fixed and floating point).'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-INSTRUCTION-SET', 'Instruction set', 1, 'Instruction set and addressing modes.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-ADDRESSING-MODES', 'Addressing modes', 2, 'Instruction set and addressing modes.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-ALU', 'Design of arithmetic and logic unit (ALU)', 3, 'Design of arithmetic and logic unit (ALU).'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-HARDWIRED-CONTROL', 'Hardwired control unit', 4, 'Design of control unit – hardwired and microprogrammed.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-MICROPROGRAMMED-CONTROL', 'Microprogrammed control unit', 5, 'Design of control unit – hardwired and microprogrammed.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-MEMORY-INTERFACING', 'Memory interfacing', 6, 'Memory interfacing and hierarchy: performance, cache memory mapping.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-MEMORY-HIERARCHY-PERFORMANCE', 'Memory hierarchy and performance', 7, 'Memory interfacing and hierarchy: performance, cache memory mapping.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-CACHE-MEMORY-MAPPING', 'Cache memory mapping', 8, 'Memory interfacing and hierarchy: performance, cache memory mapping.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-IO-INTERFACE', 'I/O interface', 9, 'I/O interface (interrupt and DMA).'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-INTERRUPT', 'Interrupt', 10, 'I/O interface (interrupt and DMA).'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-DMA', 'DMA', 11, 'I/O interface (interrupt and DMA).'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-INSTRUCTION-PIPELINING', 'Instruction pipelining', 12, 'Instruction pipelining, pipeline hazards.'),
    ('CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S3-PIPELINE-HAZARDS', 'Pipeline hazards', 13, 'Instruction pipelining, pipeline hazards.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-PROGRAMMING-C', 'Programming in C', 1, 'Programming in C.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-RECURSION', 'Recursion', 2, 'Recursion.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-ARRAYS', 'Arrays', 3, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-STACKS', 'Stacks', 4, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-QUEUES', 'Queues', 5, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-LINKED-LISTS', 'Linked lists', 6, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-TREES', 'Trees', 7, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-BINARY-SEARCH-TREES', 'Binary search trees', 8, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-BINARY-HEAPS', 'Binary heaps', 9, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S4-GRAPHS', 'Graphs', 10, 'Arrays, stacks, queues, linked lists, trees, binary search trees, binary heaps, graphs.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-SEARCHING', 'Searching', 1, 'Searching, sorting, hashing.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-SORTING', 'Sorting', 2, 'Searching, sorting, hashing.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-HASHING', 'Hashing', 3, 'Searching, sorting, hashing.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-ASYMPTOTIC-WORST-CASE-TIME', 'Asymptotic worst-case time complexity', 4, 'Asymptotic worst case time and space complexity.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-ASYMPTOTIC-WORST-CASE-SPACE', 'Asymptotic worst-case space complexity', 5, 'Asymptotic worst case time and space complexity.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-GREEDY', 'Greedy', 6, 'Algorithm design techniques: greedy, dynamic programming and divide-and-conquer.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-DYNAMIC-PROGRAMMING', 'Dynamic programming', 7, 'Algorithm design techniques: greedy, dynamic programming and divide-and-conquer.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-DIVIDE-CONQUER', 'Divide-and-conquer', 8, 'Algorithm design techniques: greedy, dynamic programming and divide-and-conquer.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-GRAPH-TRAVERSALS', 'Graph traversals', 9, 'Graph traversals, minimum spanning trees, shortest paths.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-MINIMUM-SPANNING-TREES', 'Minimum spanning trees', 10, 'Graph traversals, minimum spanning trees, shortest paths.'),
    ('CS-S5-ALGORITHMS', 'CS-S5-SHORTEST-PATHS', 'Shortest paths', 11, 'Graph traversals, minimum spanning trees, shortest paths.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-REGULAR-EXPRESSIONS', 'Regular expressions', 1, 'Regular expressions and finite automata.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-FINITE-AUTOMATA', 'Finite automata', 2, 'Regular expressions and finite automata.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-CONTEXT-FREE-GRAMMARS', 'Context-free grammars', 3, 'Context-free grammars and push-down automata.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-PUSH-DOWN-AUTOMATA', 'Push-down automata', 4, 'Context-free grammars and push-down automata.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-REGULAR-LANGUAGES', 'Regular languages', 5, 'Regular and context-free languages, pumping lemma.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-CONTEXT-FREE-LANGUAGES', 'Context-free languages', 6, 'Regular and context-free languages, pumping lemma.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-PUMPING-LEMMA', 'Pumping lemma', 7, 'Regular and context-free languages, pumping lemma.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-TURING-MACHINES', 'Turing machines', 8, 'Turing machines and undecidability.'),
    ('CS-S6-THEORY-COMPUTATION', 'CS-S6-UNDECIDABILITY', 'Undecidability', 9, 'Turing machines and undecidability.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-LEXICAL-ANALYSIS', 'Lexical analysis', 1, 'Lexical analysis, parsing, syntax-directed translation.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-PARSING', 'Parsing', 2, 'Lexical analysis, parsing, syntax-directed translation.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-SYNTAX-DIRECTED-TRANSLATION', 'Syntax-directed translation', 3, 'Lexical analysis, parsing, syntax-directed translation.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-RUNTIME-ENVIRONMENTS', 'Runtime environments', 4, 'Runtime environments.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-INTERMEDIATE-CODE-GENERATION', 'Intermediate code generation', 5, 'Intermediate code generation.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-LOCAL-OPTIMISATION', 'Local optimisation', 6, 'Local optimisation.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-CONSTANT-PROPAGATION', 'Constant propagation', 7, 'Data flow analyses: constant propagation, liveness analysis, common sub expression elimination.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-LIVENESS-ANALYSIS', 'Liveness analysis', 8, 'Data flow analyses: constant propagation, liveness analysis, common sub expression elimination.'),
    ('CS-S7-COMPILER-DESIGN', 'CS-S7-COMMON-SUBEXPRESSION-ELIMINATION', 'Common subexpression elimination', 9, 'Data flow analyses: constant propagation, liveness analysis, common sub expression elimination.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-SYSTEM-CALLS', 'System calls', 1, 'System calls, processes, threads, inter-process communication, concurrency and synchronization.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-PROCESSES', 'Processes', 2, 'System calls, processes, threads, inter-process communication, concurrency and synchronization.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-THREADS', 'Threads', 3, 'System calls, processes, threads, inter-process communication, concurrency and synchronization.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-INTER-PROCESS-COMMUNICATION', 'Inter-process communication', 4, 'System calls, processes, threads, inter-process communication, concurrency and synchronization.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-CONCURRENCY', 'Concurrency', 5, 'System calls, processes, threads, inter-process communication, concurrency and synchronization.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-SYNCHRONIZATION', 'Synchronization', 6, 'System calls, processes, threads, inter-process communication, concurrency and synchronization.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-DEADLOCK', 'Deadlock', 7, 'Deadlock.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-CPU-SCHEDULING', 'CPU scheduling', 8, 'CPU and I/O scheduling.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-IO-SCHEDULING', 'I/O scheduling', 9, 'CPU and I/O scheduling.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-MEMORY-MANAGEMENT', 'Memory management', 10, 'Memory management and virtual memory.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-VIRTUAL-MEMORY', 'Virtual memory', 11, 'Memory management and virtual memory.'),
    ('CS-S8-OPERATING-SYSTEM', 'CS-S8-FILE-SYSTEMS', 'File systems', 12, 'File systems.'),
    ('CS-S9-DATABASES', 'CS-S9-ER-MODEL', 'ER model', 1, 'ER-model.'),
    ('CS-S9-DATABASES', 'CS-S9-RELATIONAL-MODEL', 'Relational model', 2, 'Relational model: relational algebra, tuple calculus, SQL.'),
    ('CS-S9-DATABASES', 'CS-S9-RELATIONAL-ALGEBRA', 'Relational algebra', 3, 'Relational model: relational algebra, tuple calculus, SQL.'),
    ('CS-S9-DATABASES', 'CS-S9-TUPLE-CALCULUS', 'Tuple calculus', 4, 'Relational model: relational algebra, tuple calculus, SQL.'),
    ('CS-S9-DATABASES', 'CS-S9-SQL', 'SQL', 5, 'Relational model: relational algebra, tuple calculus, SQL.'),
    ('CS-S9-DATABASES', 'CS-S9-INTEGRITY-CONSTRAINTS', 'Integrity constraints', 6, 'Integrity constraints, normal forms.'),
    ('CS-S9-DATABASES', 'CS-S9-NORMAL-FORMS', 'Normal forms', 7, 'Integrity constraints, normal forms.'),
    ('CS-S9-DATABASES', 'CS-S9-FILE-ORGANIZATION', 'File organization', 8, 'File organization, indexing (e.g., B and B+ trees).'),
    ('CS-S9-DATABASES', 'CS-S9-INDEXING', 'Indexing', 9, 'File organization, indexing (e.g., B and B+ trees).'),
    ('CS-S9-DATABASES', 'CS-S9-B-TREES', 'B trees', 10, 'File organization, indexing (e.g., B and B+ trees).'),
    ('CS-S9-DATABASES', 'CS-S9-B-PLUS-TREES', 'B+ trees', 11, 'File organization, indexing (e.g., B and B+ trees).'),
    ('CS-S9-DATABASES', 'CS-S9-TRANSACTIONS', 'Transactions', 12, 'Transactions and concurrency control.'),
    ('CS-S9-DATABASES', 'CS-S9-CONCURRENCY-CONTROL', 'Concurrency control', 13, 'Transactions and concurrency control.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-PRINCIPLES-LAYERING', 'Principles of layering', 1, 'Principles of Layering.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-CIRCUIT-SWITCHING', 'Circuit switching', 2, 'Basics of switching (circuit, packet and virtual circuit) and performance metrics.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-PACKET-SWITCHING', 'Packet switching', 3, 'Basics of switching (circuit, packet and virtual circuit) and performance metrics.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-VIRTUAL-CIRCUIT-SWITCHING', 'Virtual-circuit switching', 4, 'Basics of switching (circuit, packet and virtual circuit) and performance metrics.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-PERFORMANCE-METRICS', 'Performance metrics', 5, 'Basics of switching (circuit, packet and virtual circuit) and performance metrics.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-ERROR-DETECTION', 'Error detection', 6, 'Data link layer: error detection, Medium Access Control, Ethernet.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-MEDIUM-ACCESS-CONTROL', 'Medium Access Control', 7, 'Data link layer: error detection, Medium Access Control, Ethernet.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-ETHERNET', 'Ethernet', 8, 'Data link layer: error detection, Medium Access Control, Ethernet.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-DISTANCE-VECTOR-ROUTING', 'Distance-vector routing', 9, 'Distance vector and link state routing.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-LINK-STATE-ROUTING', 'Link-state routing', 10, 'Distance vector and link state routing.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-IPV4-FRAGMENTATION', 'IPv4 fragmentation', 11, 'IPv4 - Fragmentation, CIDR Notation, Network Address Translation.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-CIDR-NOTATION', 'CIDR notation', 12, 'IPv4 - Fragmentation, CIDR Notation, Network Address Translation.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-NETWORK-ADDRESS-TRANSLATION', 'Network Address Translation', 13, 'IPv4 - Fragmentation, CIDR Notation, Network Address Translation.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-TCP-FLOW-CONTROL', 'TCP flow control', 14, 'TCP - flow control and congestion control, socket API.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-TCP-CONGESTION-CONTROL', 'TCP congestion control', 15, 'TCP - flow control and congestion control, socket API.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-SOCKET-API', 'Socket API', 16, 'TCP - flow control and congestion control, socket API.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-DNS', 'DNS', 17, 'DNS and HTTP.'),
    ('CS-S10-COMPUTER-NETWORKS', 'CS-S10-HTTP', 'HTTP', 18, 'DNS and HTTP.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'Verbal Aptitude', 1, 'Section 1: Verbal Aptitude'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'Quantitative Aptitude', 2, 'Section 2: Quantitative Aptitude'),
    ('GA', 'GA-S3-ANALYTICAL-APTITUDE', 'Analytical Aptitude', 3, 'Section 3: Analytical Aptitude'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'Spatial Aptitude', 4, 'Section 4: Spatial Aptitude')
)
insert into public.topics (
  subject_id, parent_topic_id, code, syllabus_version, name, display_order,
  is_official, official_source_text, preparation_status
)
select subjects.id, null, seed.code, 'GATE_2027', seed.name, seed.display_order,
  true, seed.official_source_text, 'NOT_STARTED'
from root_topic_seed seed
join public.subjects subjects
  on subjects.syllabus_version = 'GATE_2027' and subjects.code = seed.subject_code
on conflict (syllabus_version, code) do update set
  subject_id = excluded.subject_id,
  parent_topic_id = null,
  name = excluded.name,
  display_order = excluded.display_order,
  is_official = true,
  official_source_text = excluded.official_source_text,
  updated_at = now();

with child_topic_seed (subject_code, parent_code, code, name, display_order, official_source_text) as (
  values
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'CS-S1-DM-LOGIC', 'Propositional and first order logic', 1, 'Propositional and first order logic.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'CS-S1-DM-SETS-RELATIONS-FUNCTIONS', 'Sets, relations and functions', 2, 'Sets, relations, functions, partial orders and lattices.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'CS-S1-DM-PARTIAL-ORDERS-LATTICES', 'Partial orders and lattices', 3, 'Sets, relations, functions, partial orders and lattices.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'CS-S1-DM-MONOIDS-GROUPS', 'Monoids and groups', 4, 'Monoids, Groups.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'CS-S1-DM-GRAPH-CONNECTIVITY-MATCHING-COLOURING', 'Graph connectivity, matching and colouring', 5, 'Graphs: connectivity, matching, colouring.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-DISCRETE-MATHEMATICS', 'CS-S1-DM-COUNTING-RECURRENCES-GENERATING-FUNCTIONS', 'Counting, recurrence relations and generating functions', 6, 'Combinatorics: counting, recurrence relations, generating functions.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'CS-S1-LA-MATRICES', 'Matrices', 1, 'Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'CS-S1-LA-DETERMINANTS', 'Determinants', 2, 'Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'CS-S1-LA-LINEAR-EQUATIONS', 'System of linear equations', 3, 'Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'CS-S1-LA-EIGENVALUES-EIGENVECTORS', 'Eigenvalues and eigenvectors', 4, 'Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-LINEAR-ALGEBRA', 'CS-S1-LA-LU-DECOMPOSITION', 'LU decomposition', 5, 'Matrices, determinants, system of linear equations, eigenvalues and eigenvectors, LU decomposition.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'CS-S1-CA-LIMITS-CONTINUITY-DIFFERENTIABILITY', 'Limits, continuity and differentiability', 1, 'Limits, continuity and differentiability.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'CS-S1-CA-MAXIMA-MINIMA', 'Maxima and minima', 2, 'Maxima and minima.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'CS-S1-CA-MEAN-VALUE-THEOREM', 'Mean value theorem', 3, 'Mean value theorem.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-CALCULUS', 'CS-S1-CA-INTEGRATION', 'Integration', 4, 'Integration.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'CS-S1-PS-RANDOM-VARIABLES', 'Random variables', 1, 'Random variables, Uniform, normal, exponential, Poisson and binomial distributions.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'CS-S1-PS-DISTRIBUTIONS', 'Uniform, normal, exponential, Poisson and binomial distributions', 2, 'Random variables, Uniform, normal, exponential, Poisson and binomial distributions.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'CS-S1-PS-DESCRIPTIVE-STATISTICS', 'Mean, median, mode and standard deviation', 3, 'Mean, median, mode and standard deviation.'),
    ('CS-S1-ENGINEERING-MATHEMATICS', 'CS-S1-PROBABILITY-STATISTICS', 'CS-S1-PS-CONDITIONAL-PROBABILITY-BAYES', 'Conditional probability and Bayes theorem', 4, 'Conditional probability and Bayes theorem.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-BASIC-ENGLISH-GRAMMAR', 'Basic English grammar', 1, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-TENSES', 'Tenses', 2, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-ARTICLES', 'Articles', 3, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-ADJECTIVES', 'Adjectives', 4, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-PREPOSITIONS', 'Prepositions', 5, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-CONJUNCTIONS', 'Conjunctions', 6, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-VERB-NOUN-AGREEMENT', 'Verb-noun agreement', 7, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-OTHER-PARTS-SPEECH', 'Other parts of speech', 8, 'Basic English grammar: tenses, articles, adjectives, prepositions, conjunctions, verb-noun agreement, and other parts of speech.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-BASIC-VOCABULARY', 'Basic vocabulary', 9, 'Basic vocabulary: words, idioms, and phrases in context.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-WORDS-CONTEXT', 'Words in context', 10, 'Basic vocabulary: words, idioms, and phrases in context.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-IDIOMS-CONTEXT', 'Idioms in context', 11, 'Basic vocabulary: words, idioms, and phrases in context.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-PHRASES-CONTEXT', 'Phrases in context', 12, 'Basic vocabulary: words, idioms, and phrases in context.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-READING-COMPREHENSION', 'Reading and comprehension', 13, 'Reading and comprehension, Narrative sequencing.'),
    ('GA', 'GA-S1-VERBAL-APTITUDE', 'GA-S1-NARRATIVE-SEQUENCING', 'Narrative sequencing', 14, 'Reading and comprehension, Narrative sequencing.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-DATA-INTERPRETATION', 'Data interpretation', 1, 'Data interpretation: data graphs, 2-and 3-dimensional plots, maps, and tables.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-BAR-GRAPHS', 'Bar graphs', 2, 'Data graphs (bar graphs, pie charts, and other graphs representing data).'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-PIE-CHARTS', 'Pie charts', 3, 'Data graphs (bar graphs, pie charts, and other graphs representing data).'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-OTHER-DATA-GRAPHS', 'Other graphs representing data', 4, 'Data graphs (bar graphs, pie charts, and other graphs representing data).'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-2D-PLOTS', '2-dimensional plots', 5, '2-and 3-dimensional plots, maps, and tables.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-3D-PLOTS', '3-dimensional plots', 6, '2-and 3-dimensional plots, maps, and tables.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-MAPS', 'Maps', 7, '2-and 3-dimensional plots, maps, and tables.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-TABLES', 'Tables', 8, '2-and 3-dimensional plots, maps, and tables.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-NUMERICAL-COMPUTATION-ESTIMATION', 'Numerical computation and estimation', 9, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-RATIOS', 'Ratios', 10, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-PERCENTAGES', 'Percentages', 11, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-POWERS', 'Powers', 12, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-EXPONENTS-LOGARITHMS', 'Exponents and logarithms', 13, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-PERMUTATIONS-COMBINATIONS', 'Permutations and combinations', 14, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-SERIES', 'Series', 15, 'Numerical computation and estimation: ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-MENSURATION-GEOMETRY', 'Mensuration and geometry', 16, 'Mensuration and geometry.'),
    ('GA', 'GA-S2-QUANTITATIVE-APTITUDE', 'GA-S2-ELEMENTARY-STATISTICS-PROBABILITY', 'Elementary statistics and probability', 17, 'Elementary statistics and probability.'),
    ('GA', 'GA-S3-ANALYTICAL-APTITUDE', 'GA-S3-LOGIC-DEDUCTION-INDUCTION', 'Logic: deduction and induction', 1, 'Logic: deduction and induction, Analogy, Numerical relations and reasoning.'),
    ('GA', 'GA-S3-ANALYTICAL-APTITUDE', 'GA-S3-ANALOGY', 'Analogy', 2, 'Logic: deduction and induction, Analogy, Numerical relations and reasoning.'),
    ('GA', 'GA-S3-ANALYTICAL-APTITUDE', 'GA-S3-NUMERICAL-RELATIONS-REASONING', 'Numerical relations and reasoning', 3, 'Logic: deduction and induction, Analogy, Numerical relations and reasoning.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-TRANSFORMATION-SHAPES', 'Transformation of shapes', 1, 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping; paper folding, cutting, and patterns in 2 and 3 dimensions.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-TRANSLATION', 'Translation', 2, 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-ROTATION', 'Rotation', 3, 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-SCALING', 'Scaling', 4, 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-MIRRORING', 'Mirroring', 5, 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-ASSEMBLING-GROUPING', 'Assembling and grouping', 6, 'Transformation of shapes: translation, rotation, scaling, mirroring, assembling, and grouping.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-PAPER-FOLDING', 'Paper folding', 7, 'Paper folding, cutting, and patterns in 2 and 3 dimensions.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-PAPER-CUTTING', 'Paper cutting', 8, 'Paper folding, cutting, and patterns in 2 and 3 dimensions.'),
    ('GA', 'GA-S4-SPATIAL-APTITUDE', 'GA-S4-2D-3D-PATTERNS', 'Patterns in 2 and 3 dimensions', 9, 'Paper folding, cutting, and patterns in 2 and 3 dimensions.')
)
insert into public.topics (
  subject_id, parent_topic_id, code, syllabus_version, name, display_order,
  is_official, official_source_text, preparation_status
)
select subjects.id, parents.id, seed.code, 'GATE_2027', seed.name, seed.display_order,
  true, seed.official_source_text, 'NOT_STARTED'
from child_topic_seed seed
join public.subjects subjects
  on subjects.syllabus_version = 'GATE_2027' and subjects.code = seed.subject_code
join public.topics parents
  on parents.syllabus_version = 'GATE_2027' and parents.code = seed.parent_code
  and parents.subject_id = subjects.id
on conflict (syllabus_version, code) do update set
  subject_id = excluded.subject_id,
  parent_topic_id = excluded.parent_topic_id,
  name = excluded.name,
  display_order = excluded.display_order,
  is_official = true,
  official_source_text = excluded.official_source_text,
  updated_at = now();

commit;

import '../db/schema.js'
import { ingestQuestions, corpusSize } from '../corpus/corpusManager.js'
import { buildInvertedIndex, vocabularySize } from '../index/invertedIndex.js'
import type { StackOverflowQuestionRaw } from '../types.js'

export const SEED_QUESTIONS: StackOverflowQuestionRaw[] = [
  // --- PYTHON ---
  {
    questionId: '423379',
    title: 'Using global variables in a function in Python',
    body: 'I have a variable declared in one function and I want to access or modify its value inside another function. Should I use return values, function parameters, or global variables? What is the best practice for scope management?',
    tag: 'python',
    tags: ['python', 'function', 'scope'],
    createdUtc: 1231456789,
    score: 5840,
    answerCount: 24,
    link: 'https://stackoverflow.com/questions/423379/using-global-variables-in-a-function',
  },
  {
    questionId: '22108488',
    title: 'Are list comprehensions always faster than for loops in Python?',
    body: 'List comprehensions look cleaner and pythonic, but are they faster than standard for loops with append? When should I avoid complex list comprehensions for readability and maintainability?',
    tag: 'python',
    tags: ['python', 'list-comprehension', 'loops'],
    createdUtc: 1393712345,
    score: 950,
    answerCount: 8,
    link: 'https://stackoverflow.com/questions/22108488/are-list-comprehensions-always-faster-than-for-loops',
  },
  {
    questionId: '730113',
    title: 'Why is dictionary lookup O(1) in Python? How are dictionaries implemented?',
    body: 'I am reading about time complexity and data structures. How does Python implement dict under the hood using hash tables? What happens when a hash collision occurs and how does open addressing work?',
    tag: 'python',
    tags: ['python', 'dictionary', 'hashmap', 'data-structures'],
    createdUtc: 1239123456,
    score: 3120,
    answerCount: 22,
    link: 'https://stackoverflow.com/questions/730113/how-are-dictionaries-implemented-in-python',
  },
  {
    questionId: '49005651',
    title: 'How does asyncio actually work in Python? Event loop and coroutines',
    body: 'Is asyncio only useful for network I/O bound tasks? Why does asynchronous programming not speed up CPU bound calculations? Multiprocessing vs threading vs async coroutines explained.',
    tag: 'python',
    tags: ['python', 'async-await', 'asyncio', 'multithreading'],
    createdUtc: 1519712345,
    score: 2450,
    answerCount: 19,
    link: 'https://stackoverflow.com/questions/49005651/how-does-asyncio-actually-work',
  },
  {
    questionId: '231767',
    title: 'What does the yield keyword do in Python?',
    body: 'What is the difference between return and yield in Python? How does a generator function maintain its state across multiple iterations and save memory with lazy evaluation?',
    tag: 'python',
    tags: ['python', 'generator', 'yield', 'iterator'],
    createdUtc: 1224765432,
    score: 13136,
    answerCount: 51,
    link: 'https://stackoverflow.com/questions/231767/what-does-the-yield-keyword-do-in-python',
  },
  {
    questionId: '1602934',
    title: 'How to check if a given key already exists in a dictionary in Python?',
    body: 'What is the most idiomatic and safe way to check if a key is present in a dictionary before accessing it in Python? Should I use in keyword, try except KeyError, or get method with a default value?',
    tag: 'python',
    tags: ['python', 'dictionary'],
    createdUtc: 1256123456,
    score: 4100,
    answerCount: 15,
    link: 'https://stackoverflow.com/questions/1602934/check-if-a-given-key-already-exists-in-a-dictionary',
  },

  // --- JAVASCRIPT / TYPESCRIPT ---
  {
    questionId: '22539815',
    title: 'What is a promise and how does it work in JavaScript?',
    body: 'I want to avoid callback hell in asynchronous JavaScript. How do Promise.resolve, Promise.reject, .then, and async/await work under the hood with the microtask queue in the browser event loop?',
    tag: 'javascript',
    tags: ['javascript', 'promise', 'async-await', 'event-loop'],
    createdUtc: 1395345678,
    score: 8740,
    answerCount: 28,
    link: 'https://stackoverflow.com/questions/22539815/what-is-a-promise-and-how-does-it-work',
  },
  {
    questionId: '762011',
    title: 'What is the difference between using let and var in JavaScript?',
    body: 'Explain variable hoisting, block scope vs function scope, and temporal dead zone (TDZ). Why should developers avoid var in ES6+ codebases?',
    tag: 'javascript',
    tags: ['javascript', 'ecmascript-6', 'scope', 'variables'],
    createdUtc: 1239876543,
    score: 6320,
    answerCount: 31,
    link: 'https://stackoverflow.com/questions/762011/whats-the-difference-between-using-let-and-var',
  },
  {
    questionId: '122102',
    title: 'What is the most efficient way to deep clone an object in JavaScript?',
    body: 'What is the fastest and safest way to deep copy an object without losing Date instances, functions, or circular references? Comparing structuredClone, JSON.parse(JSON.stringify), and Lodash cloneDeep.',
    tag: 'javascript',
    tags: ['javascript', 'object', 'deep-copy'],
    createdUtc: 1222123456,
    score: 7190,
    answerCount: 48,
    link: 'https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript',
  },
  {
    questionId: '359494',
    title: 'Which equals operator (== vs ===) should be used in JavaScript comparisons?',
    body: 'Why does loose equality (==) perform automatic type coercion while strict equality (===) compares value and type without converting? Common pitfalls with null, undefined, and false.',
    tag: 'javascript',
    tags: ['javascript', 'operators', 'equality'],
    createdUtc: 1228987654,
    score: 3620,
    answerCount: 17,
    link: 'https://stackoverflow.com/questions/359494/which-equals-operator-vs-should-be-used-in-javascript-comparisons',
  },
  {
    questionId: '37233735',
    title: 'Interfaces vs Types in TypeScript: what are the differences?',
    body: 'Both interfaces and type aliases can define object shapes. What are the key differences regarding declaration merging, union types, intersection, and compiler performance?',
    tag: 'typescript',
    tags: ['typescript', 'interface', 'type-alias'],
    createdUtc: 1463312345,
    score: 3500,
    answerCount: 16,
    link: 'https://stackoverflow.com/questions/37233735/typescript-interfaces-vs-types',
  },

  // --- REACT ---
  {
    questionId: '53070970',
    title: 'Infinite loop in useEffect when updating state in React component',
    body: 'My component keeps fetching data in an infinite loop. How does useEffect track dependencies, and how do useMemo and useCallback prevent unnecessary object recreation?',
    tag: 'reactjs',
    tags: ['reactjs', 'react-hooks', 'use-effect'],
    createdUtc: 1540912345,
    score: 5120,
    answerCount: 24,
    link: 'https://stackoverflow.com/questions/53070970/infinite-loop-in-useeffect-when-updating-state',
  },
  {
    questionId: '49343209',
    title: 'React Context API vs Redux: when should each be used?',
    body: 'Is Context API sufficient for global application state in medium applications? Does Context re-render every consumer when a single property in the value object changes?',
    tag: 'reactjs',
    tags: ['reactjs', 'state-management', 'redux', 'react-context'],
    createdUtc: 1521312345,
    score: 2900,
    answerCount: 17,
    link: 'https://stackoverflow.com/questions/49343209/react-context-api-vs-redux',
  },
  {
    questionId: '53008444',
    title: 'How to prevent re-rendering of child components in React with React.memo?',
    body: 'My parent component updates its state and all children are re-rendering needlessly. How to use React.memo, useCallback, and useMemo effectively to optimize render performance?',
    tag: 'reactjs',
    tags: ['reactjs', 'performance', 'react-memo'],
    createdUtc: 1540512345,
    score: 1480,
    answerCount: 16,
    link: 'https://stackoverflow.com/questions/53008444/how-to-prevent-re-rendering-of-child-component-in-react',
  },

  // --- SQL & DATABASE ---
  {
    questionId: '406294',
    title: 'What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN in SQL?',
    body: 'What is the exact visual difference between INNER JOIN, LEFT OUTER JOIN, and RIGHT JOIN? How does NULL handling work when a matching row is absent in the foreign table?',
    tag: 'sql',
    tags: ['sql', 'join', 'database', 'rdbms'],
    createdUtc: 1230876543,
    score: 11500,
    answerCount: 35,
    link: 'https://stackoverflow.com/questions/406294/what-is-the-difference-between-inner-join-and-outer-join',
  },
  {
    questionId: '1108',
    title: 'How does database indexing work in relational databases?',
    body: 'How do database indexes speed up SELECT WHERE queries, and why do they slow down INSERT and UPDATE operations? When should you create composite indexes on multiple columns with B-Tree?',
    tag: 'sql',
    tags: ['sql', 'database-indexes', 'query-optimization', 'b-tree'],
    createdUtc: 1217654321,
    score: 4200,
    answerCount: 15,
    link: 'https://stackoverflow.com/questions/1108/how-does-database-indexing-work',
  },
  {
    questionId: '2871719',
    title: 'What is the difference between WHERE and HAVING clause in SQL?',
    body: 'Both clauses filter records in relational queries, but where do GROUP BY and aggregate functions like COUNT, SUM, and AVG come into play? Why cannot you use aggregate functions in WHERE?',
    tag: 'sql',
    tags: ['sql', 'group-by', 'having'],
    createdUtc: 1274512345,
    score: 2790,
    answerCount: 19,
    link: 'https://stackoverflow.com/questions/2871719/difference-between-where-and-having-clause',
  },

  // --- GIT ---
  {
    questionId: '927358',
    title: 'How do I undo the most recent local commits in Git without losing changes?',
    body: 'I committed changes to local Git repository by mistake. How do I undo git commit while keeping the modified files staged or unstaged in my working tree? git reset --soft vs --mixed vs --hard.',
    tag: 'git',
    tags: ['git', 'version-control', 'git-reset', 'git-commit'],
    createdUtc: 1243567890,
    score: 24900,
    answerCount: 92,
    link: 'https://stackoverflow.com/questions/927358/how-do-i-undo-the-most-recent-local-commits-in-git',
  },
  {
    questionId: '16666089',
    title: 'What is the difference between git merge and git rebase?',
    body: 'What are the pros and cons of merging branches vs rebasing feature branches onto main? How does git rebase maintain a clean linear commit history and when does it become dangerous?',
    tag: 'git',
    tags: ['git', 'git-rebase', 'git-merge', 'branching-and-merging'],
    createdUtc: 1369123456,
    score: 7800,
    answerCount: 30,
    link: 'https://stackoverflow.com/questions/16666089/whats-the-difference-between-git-merge-and-git-rebase',
  },

  // --- DOCKER ---
  {
    questionId: '50126741',
    title: 'How to reduce Docker image size with multi-stage builds and Alpine Linux?',
    body: 'My Node.js and Python Docker containers are over 1GB. How do multi-stage Dockerfile stages separate build dependencies from the final minimal production runtime image?',
    tag: 'docker',
    tags: ['docker', 'dockerfile', 'containers', 'optimization'],
    createdUtc: 1525212345,
    score: 3600,
    answerCount: 14,
    link: 'https://stackoverflow.com/questions/50126741/how-to-reduce-docker-image-size-with-multi-stage-builds',
  },
  {
    questionId: '21553353',
    title: 'What is the difference between CMD and ENTRYPOINT in a Dockerfile?',
    body: 'Both instructions define what command executes when a Docker container starts. How do they interact when combined, and how can arguments be passed or overridden via docker run?',
    tag: 'docker',
    tags: ['docker', 'dockerfile', 'cmd', 'entrypoint'],
    createdUtc: 1391512345,
    score: 5400,
    answerCount: 20,
    link: 'https://stackoverflow.com/questions/21553353/what-is-the-difference-between-cmd-and-entrypoint-in-a-dockerfile',
  },

  // --- ALGORITHMS & DATA STRUCTURES ---
  {
    questionId: '1177610',
    title: 'When to use a Hash Table over a Binary Search Tree (BST)?',
    body: 'Hash tables offer average O(1) lookups, so why do relational databases and language libraries use AVL trees, Red-Black trees, or B-Trees for indexing and range queries?',
    tag: 'algorithms',
    tags: ['algorithms', 'data-structures', 'binary-search-tree', 'hashmap'],
    createdUtc: 1248765432,
    score: 2950,
    answerCount: 12,
    link: 'https://stackoverflow.com/questions/1177610/when-to-use-a-hash-table-over-a-binary-search-tree',
  },
  {
    questionId: '6164629',
    title: 'What is the difference between memoization and tabulation in dynamic programming?',
    body: 'How do top-down recursion with memoization and bottom-up iterative tabulation differ in terms of call stack depth and space complexity? Classic 0/1 knapsack example.',
    tag: 'algorithms',
    tags: ['algorithms', 'dynamic-programming', 'memoization'],
    createdUtc: 1306512345,
    score: 3300,
    answerCount: 15,
    link: 'https://stackoverflow.com/questions/6164629/what-is-the-difference-between-bottom-up-and-top-down-dynamic-programming',
  },
]

export function runSeed(): { corpusSize: number; vocabularySize: number } {
  console.log(`Carregando ${SEED_QUESTIONS.length} perguntas clássicas do Stack Overflow no corpus...`)
  ingestQuestions(SEED_QUESTIONS)

  console.log('Construindo índice invertido (tokenização, stopwords, stemming)...')
  const indexResult = buildInvertedIndex()

  return {
    corpusSize: corpusSize(),
    vocabularySize: indexResult.vocabularySize,
  }
}

async function main() {
  const result = runSeed()
  console.log('--- Corpus inicial do Stack Overflow pronto ---')
  console.log(`Perguntas no corpus: ${result.corpusSize}`)
  console.log(`Termos no vocabulário: ${result.vocabularySize}`)
  process.exit(0)
}

const isDirectRun = process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')
if (isDirectRun) {
  main().catch((err) => {
    console.error('Falha no seed:', err)
    process.exit(1)
  })
}

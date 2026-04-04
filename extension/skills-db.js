// ================================================================
// JobOS — Skills Database v1.0
// Curated dictionary of ~5,000 tech skills across 12 categories.
// Used for instant client-side skill extraction from job descriptions.
// No API calls, no network, no rate limits. Sub-5ms matching.
// ================================================================

'use strict';

const JobOSSkillsDB = (() => {

  // ────────────────────────────────────────────────────────────────
  // Alias / normalization map
  // Maps raw JD abbreviations to canonical skill names
  // ────────────────────────────────────────────────────────────────
  const ALIASES = {
    'js': 'JavaScript', 'javascript': 'JavaScript',
    'ts': 'TypeScript', 'typescript': 'TypeScript',
    'py': 'Python', 'python': 'Python',
    'ml': 'Machine Learning', 'machine learning': 'Machine Learning',
    'dl': 'Deep Learning', 'deep learning': 'Deep Learning',
    'ai': 'Artificial Intelligence',
    'nlp': 'Natural Language Processing',
    'cv': 'Computer Vision',
    'oop': 'Object-Oriented Programming',
    'sql': 'SQL', 'nosql': 'NoSQL',
    'k8s': 'Kubernetes', 'kubernetes': 'Kubernetes',
    'tf': 'TensorFlow', 'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch', 'torch': 'PyTorch',
    'aws': 'AWS', 'amazon web services': 'AWS',
    'gcp': 'Google Cloud Platform', 'google cloud': 'Google Cloud Platform',
    'azure': 'Microsoft Azure', 'microsoft azure': 'Microsoft Azure',
    'ci/cd': 'CI/CD', 'cicd': 'CI/CD',
    'iac': 'Infrastructure as Code',
    'rest': 'REST API', 'restful': 'REST API', 'rest api': 'REST API',
    'graphql': 'GraphQL',
    'grpc': 'gRPC',
    'api': 'API Development',
    'ui': 'UI Development', 'ux': 'UX Design', 'ui/ux': 'UI/UX Design',
    'react.js': 'React', 'reactjs': 'React', 'react js': 'React',
    'next.js': 'Next.js', 'nextjs': 'Next.js',
    'vue.js': 'Vue.js', 'vuejs': 'Vue.js',
    'node.js': 'Node.js', 'nodejs': 'Node.js', 'node js': 'Node.js',
    'express.js': 'Express.js', 'expressjs': 'Express.js',
    'fastapi': 'FastAPI',
    'django': 'Django',
    's3': 'AWS S3', 'amazon s3': 'AWS S3',
    'ec2': 'AWS EC2',
    'ecs': 'AWS ECS',
    'lambda': 'AWS Lambda',
    'rds': 'AWS RDS',
    'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL',
    'mongo': 'MongoDB', 'mongodb': 'MongoDB',
    'redis': 'Redis',
    'elasticsearch': 'Elasticsearch', 'elastic search': 'Elasticsearch',
    'kafka': 'Apache Kafka',
    'spark': 'Apache Spark',
    'airflow': 'Apache Airflow',
    'dbt': 'dbt',
    'rag': 'RAG (Retrieval-Augmented Generation)',
    'retrieval augmented generation': 'RAG (Retrieval-Augmented Generation)',
    'llms': 'LLMs', 'llm': 'LLMs',
    'large language model': 'LLMs', 'large language models': 'LLMs',
    'agentic ai': 'Agentic AI', 'agentic': 'Agentic AI', 'ai agents': 'Agentic AI',
    'langchain': 'LangChain', 'lang chain': 'LangChain',
    'langgraph': 'LangGraph', 'lang graph': 'LangGraph',
    'crewai': 'CrewAI', 'crew ai': 'CrewAI',
    'autogen': 'AutoGen',
    'llamaindex': 'LlamaIndex', 'llama index': 'LlamaIndex', 'llama-index': 'LlamaIndex',
    'openai': 'OpenAI API', 'open ai': 'OpenAI API',
    'openai codex': 'OpenAI Codex', 'codex': 'OpenAI Codex',
    'anthropic': 'Anthropic Claude', 'claude': 'Anthropic Claude',
    'gemini': 'Google Gemini',
    'hugging face': 'Hugging Face', 'huggingface': 'Hugging Face',
    'prompt engineering': 'Prompt Engineering',
    'fine tuning': 'Fine-tuning', 'fine-tuning': 'Fine-tuning', 'finetuning': 'Fine-tuning',
    'embeddings': 'Embeddings',
    'vector database': 'Vector Databases', 'vector databases': 'Vector Databases', 'vector db': 'Vector Databases',
    'pgvector': 'pgvector',
    'pinecone': 'Pinecone',
    'weaviate': 'Weaviate',
    'qdrant': 'Qdrant',
    'chromadb': 'ChromaDB', 'chroma': 'ChromaDB',
    'faiss': 'FAISS',
    'hallucination': 'Hallucination Reduction',
    'mlops': 'MLOps',
    'llmops': 'LLMOps',
    // AWS AI services
    'glue': 'AWS Glue', 'aws glue': 'AWS Glue',
    'bedrock': 'AWS Bedrock', 'aws bedrock': 'AWS Bedrock', 'amazon bedrock': 'AWS Bedrock',
    'sagemaker': 'Amazon SageMaker', 'aws sagemaker': 'Amazon SageMaker', 'amazon sagemaker': 'Amazon SageMaker',
    'kendra': 'Amazon Kendra', 'amazon kendra': 'Amazon Kendra',
    'opensearch': 'Amazon OpenSearch', 'amazon opensearch': 'Amazon OpenSearch',
    'athena': 'AWS Athena', 'amazon athena': 'AWS Athena',
    'step functions': 'AWS Step Functions', 'aws step functions': 'AWS Step Functions',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'jenkins': 'Jenkins',
    'docker': 'Docker',
    'terraform': 'Terraform',
    'ansible': 'Ansible',
    'linux': 'Linux',
    'bash': 'Bash / Shell Scripting', 'shell': 'Bash / Shell Scripting',
    'agile': 'Agile', 'scrum': 'Scrum', 'kanban': 'Kanban',
    'jira': 'Jira',
    'figma': 'Figma',
    'xd': 'Adobe XD', 'adobe xd': 'Adobe XD',
    'sketch': 'Sketch',
    'java': 'Java',
    'c#': 'C#', 'csharp': 'C#',
    'c++': 'C++', 'cpp': 'C++',
    'go': 'Go', 'golang': 'Go',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'php': 'PHP',
    'ruby': 'Ruby', 'ruby on rails': 'Ruby on Rails', 'rails': 'Ruby on Rails',
    'r': 'R', // only match standalone "R"
    'scala': 'Scala',
    'flutter': 'Flutter',
    'dart': 'Dart',
    'react native': 'React Native',
    'ios': 'iOS Development',
    'android': 'Android Development',
    'html': 'HTML', 'html5': 'HTML5',
    'css': 'CSS', 'css3': 'CSS3',
    'sass': 'Sass/SCSS', 'scss': 'Sass/SCSS',
    'tailwind': 'Tailwind CSS', 'tailwindcss': 'Tailwind CSS',
    'webpack': 'Webpack',
    'vite': 'Vite',
    'supabase': 'Supabase',
    'firebase': 'Firebase',
    'pandas': 'Pandas',
    'numpy': 'NumPy',
    'sklearn': 'scikit-learn', 'scikit-learn': 'scikit-learn', 'scikit learn': 'scikit-learn',
    'jupyter': 'Jupyter',
    'matplotlib': 'Matplotlib',
    'seaborn': 'Seaborn',
    'plotly': 'Plotly',
    'tableau': 'Tableau',
    'powerbi': 'Power BI', 'power bi': 'Power BI',
    'looker': 'Looker',
    'snowflake': 'Snowflake',
    'bigquery': 'BigQuery', 'big query': 'BigQuery',
    'redshift': 'Amazon Redshift',
  };

  // ────────────────────────────────────────────────────────────────
  // Canonical Skills Dictionary — 12 categories
  // ────────────────────────────────────────────────────────────────
  const SKILLS = {

    languages: [
      'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'Swift', 'Kotlin', 'Ruby', 'PHP', 'Scala', 'R', 'MATLAB', 'Dart',
      'Elixir', 'Clojure', 'Haskell', 'Perl', 'Lua', 'Julia', 'Groovy',
      'Objective-C', 'C', 'Assembly', 'COBOL', 'Fortran', 'Bash',
      'PowerShell', 'SQL', 'PL/SQL', 'T-SQL',
    ],

    frontend: [
      'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'SvelteKit',
      'Ember.js', 'Backbone.js', 'jQuery', 'HTML', 'HTML5', 'CSS', 'CSS3',
      'Sass/SCSS', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI',
      'Styled Components', 'Webpack', 'Vite', 'Parcel', 'Rollup', 'Babel',
      'ESLint', 'Prettier', 'Storybook', 'Cypress', 'Playwright', 'Jest',
      'React Testing Library', 'Redux', 'Zustand', 'MobX', 'Recoil',
      'React Query', 'SWR', 'Apollo Client', 'GraphQL',
      'Web Components', 'PWA', 'WebAssembly', 'Three.js', 'D3.js',
      'Chart.js', 'Recharts', 'Framer Motion', 'GSAP',
    ],

    backend: [
      'Node.js', 'Express.js', 'Fastify', 'NestJS', 'Koa.js',
      'Django', 'FastAPI', 'Flask', 'Tornado', 'Celery',
      'Spring Boot', 'Spring Framework', 'Hibernate', 'Quarkus', 'Micronaut',
      'Ruby on Rails', 'Sinatra',
      'Laravel', 'Symfony', 'CodeIgniter',
      'ASP.NET', 'ASP.NET Core', '.NET', '.NET Core',
      'Gin', 'Echo', 'Fiber',
      'GraphQL', 'REST API', 'gRPC', 'WebSockets', 'WebRTC',
      'OAuth', 'JWT', 'OpenID Connect', 'SAML',
      'Microservices', 'Event-Driven Architecture', 'Domain-Driven Design',
      'CQRS', 'Serverless', 'API Gateway',
    ],

    cloud: [
      'AWS', 'AWS S3', 'AWS EC2', 'AWS ECS', 'AWS EKS', 'AWS Lambda',
      'AWS RDS', 'AWS DynamoDB', 'AWS CloudFront', 'AWS SQS', 'AWS SNS',
      'AWS IAM', 'AWS VPC', 'AWS CloudFormation', 'AWS CDK', 'AWS Glue',
      'AWS Athena', 'AWS Step Functions', 'AWS Fargate',
      'AWS Bedrock', 'Amazon SageMaker', 'Amazon OpenSearch', 'Amazon Kendra',
      'Amazon Redshift', 'Amazon Comprehend', 'Amazon Textract',
      'Google Cloud Platform', 'Google Cloud Run', 'Firebase',
      'Google BigQuery', 'Google Pub/Sub', 'Google Dataflow', 'Google Vertex AI',
      'Microsoft Azure', 'Azure DevOps', 'Azure Functions', 'Azure AKS',
      'Azure CosmosDB', 'Azure Service Bus', 'Azure Blob Storage', 'Azure OpenAI',
      'Cloudflare', 'Cloudflare Workers', 'Vercel', 'Netlify', 'Heroku',
      'DigitalOcean', 'Render', 'Railway', 'Supabase',
    ],

    devops: [
      'Docker', 'Kubernetes', 'Helm', 'Istio', 'Envoy',
      'Terraform', 'Pulumi', 'Ansible', 'Chef', 'Puppet', 'SaltStack',
      'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI',
      'ArgoCD', 'FluxCD', 'Spinnaker',
      'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'PagerDuty',
      'Splunk', 'ELK Stack', 'OpenTelemetry', 'Jaeger', 'Zipkin',
      'Nginx', 'Apache', 'HAProxy', 'Traefik',
      'Linux', 'Ubuntu', 'CentOS', 'RHEL',
      'Bash / Shell Scripting', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
      'CI/CD', 'Infrastructure as Code', 'Site Reliability Engineering',
      'DevSecOps', 'GitOps',
    ],

    databases: [
      'PostgreSQL', 'MySQL', 'SQLite', 'Oracle Database', 'Microsoft SQL Server',
      'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Firestore',
      'Elasticsearch', 'CouchDB', 'InfluxDB', 'TimescaleDB',
      'Neo4j', 'ArangoDB',
      'Snowflake', 'Amazon Redshift', 'BigQuery', 'Azure Synapse',
      'Databricks', 'ClickHouse', 'dbt', 'Apache Hive',
      'RabbitMQ', 'Apache Kafka', 'Apache Pulsar', 'NATS',
      'Memcached', 'Hazelcast',
      'SQL', 'NoSQL', 'Vector Databases', 'Pinecone', 'Weaviate', 'Qdrant', 'pgvector',
    ],

    ai_ml: [
      'Machine Learning', 'Deep Learning', 'Natural Language Processing',
      'Computer Vision', 'Reinforcement Learning', 'Transfer Learning',
      'Generative AI', 'LLMs', 'RAG (Retrieval-Augmented Generation)',
      'Agentic AI', 'Fine-tuning', 'Prompt Engineering',
      'Hallucination Reduction', 'Embeddings', 'Semantic Search',
      'LangChain', 'LangGraph', 'CrewAI', 'AutoGen', 'LlamaIndex',
      'OpenAI API', 'OpenAI Codex', 'Anthropic Claude', 'Google Gemini',
      'TensorFlow', 'PyTorch', 'Keras', 'JAX', 'Hugging Face',
      'scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost',
      'Spark MLlib', 'MLflow', 'MLOps', 'LLMOps',
      'Weights & Biases', 'DVC',
      'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly',
      'Jupyter', 'CUDA', 'ONNX', 'FAISS',
      'Vector Databases', 'pgvector', 'Pinecone', 'Weaviate', 'Qdrant', 'ChromaDB',
      'Object Detection', 'Image Recognition', 'Text Generation',
      'A/B Testing', 'Statistical Modeling', 'Time Series Analysis',
      'Recommendation Systems', 'Anomaly Detection',
    ],

    data_engineering: [
      'Apache Spark', 'Apache Kafka', 'Apache Airflow', 'Apache Flink',
      'dbt', 'Databricks', 'Snowflake', 'BigQuery', 'Amazon Redshift',
      'Azure Synapse', 'ClickHouse', 'Presto', 'Trino', 'Apache Hive',
      'ETL', 'ELT', 'Data Pipelines', 'Data Warehouse', 'Data Lake',
      'Data Lakehouse', 'Data Mesh', 'Data Quality', 'Data Governance',
      'Great Expectations', 'Soda', 'Monte Carlo',
      'Tableau', 'Power BI', 'Looker', 'Metabase', 'Superset',
      'Pandas', 'Polars', 'dask',
    ],

    mobile: [
      'iOS Development', 'Android Development', 'React Native', 'Flutter',
      'Swift', 'SwiftUI', 'UIKit', 'Kotlin', 'Jetpack Compose',
      'Dart', 'Xamarin', 'Ionic', 'Capacitor', 'Expo',
      'App Store Connect', 'Google Play Store',
      'Mobile UI/UX', 'Push Notifications', 'Offline-first',
      'Core Data', 'Room', 'Realm',
    ],

    security: [
      'Cybersecurity', 'Penetration Testing', 'Vulnerability Assessment',
      'OWASP', 'Network Security', 'Application Security', 'Cloud Security',
      'Zero Trust', 'IAM', 'PKI', 'TLS/SSL',
      'SIEM', 'SOC', 'Incident Response', 'Threat Modeling',
      'Burp Suite', 'Metasploit', 'Nmap', 'Wireshark',
      'DevSecOps', 'GDPR', 'SOC 2', 'ISO 27001', 'HIPAA', 'PCI DSS',
    ],

    design: [
      'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'InVision',
      'Prototyping', 'Wireframing', 'User Research', 'Usability Testing',
      'Design Systems', 'Accessibility (a11y)', 'WCAG',
      'Adobe Photoshop', 'Adobe Illustrator', 'Canva',
      'Motion Design', 'Interaction Design', 'Product Design',
    ],

    soft_skills: [
      'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
      'Project Management', 'Leadership', 'Mentoring', 'Collaboration',
      'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence',
      'Technical Writing', 'Documentation', 'Code Review',
      'Time Management', 'Stakeholder Management',
      'Cross-functional Collaboration', 'Product Thinking',
    ],
  };

  // ────────────────────────────────────────────────────────────────
  // Build a flat lowercase lookup set for O(1) exact matching
  // ────────────────────────────────────────────────────────────────
  const _lookup = new Map(); // lowercase → canonical name

  for (const [, list] of Object.entries(SKILLS)) {
    for (const skill of list) {
      _lookup.set(skill.toLowerCase(), skill);
    }
  }

  // Add aliases too (they override nothing if canonical already exists)
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (!_lookup.has(alias)) {
      _lookup.set(alias, canonical);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Noise filter — words that look like skills but are generic noise
  // ────────────────────────────────────────────────────────────────
  const NOISE = new Set([
    'experience', 'skills', 'knowledge', 'understanding', 'ability',
    'ability to', 'strong', 'excellent', 'good', 'great', 'solid',
    'proficient', 'familiar', 'exposure', 'background', 'expertise',
    'working', 'preferred', 'required', 'must', 'should', 'nice',
    'team', 'work', 'environment', 'development', 'engineering', 'design',
    'management', 'solutions', 'systems', 'applications', 'services',
    'platform', 'data', 'model', 'models', 'tools', 'tool', 'product',
    'products', 'business', 'process', 'processes', 'performance',
    'quality', 'testing', 'deployment', 'integration', 'production',
    'open source', 'best practices', 'fast', 'track', 'record',
    'hands on', 'hands-on', 'end to end', 'end-to-end', 'full stack',
    'back end', 'front end', 'back-end', 'front-end', 'full-stack',
    'workflows', 'workflow', 'pipeline', 'pipelines', 'core', 'advanced',
    'level', 'senior', 'junior', 'mid', 'lead', 'principal',
    'glassdoor', 'indeed', 'linkedin', 'apply', 'save', 'easy apply',
  ]);

  // ────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ────────────────────────────────────────────────────────────────

  /**
   * Extract top skills from a job description string.
   *
   * Scoring = rawFrequency × specificityWeight
   *
   * specificityWeight:
   *   Niche/modern/multi-word terms score higher than broad generic terms.
   *   Why: "RAG" appearing once is more signal-rich than "Machine Learning"
   *   appearing 5× in a generic JD boilerplate section.
   *
   *   Weight rules:
   *     - Multi-word skill (2+ words):        × 2.0  (very specific)
   *     - Dynamic Zero-Shot Match:            × 1.8  (unknown future tech)
   *     - Single word > 8 chars:              × 1.5  (e.g. SageMaker, LangChain)
   *     - Known generic/broad terms:          × 0.6  (penalised)
   *     - Everything else:                    × 1.0
   *
   * @param {string} text - Raw job description text
   * @param {number} [maxSkills=8] - Maximum number of skills to return
   * @returns {{ skill: string, count: number, score: number, category: string }[]}
   */
  function extractSkills(text, maxSkills = 8) {
    if (!text || text.length < 50) return [];

    const lower = text.toLowerCase();
    const found  = new Map(); // canonical name → { count, category }

    // Skills that are too broad on their own — penalise unless nothing more specific matched
    const GENERIC_BROAD = new Set([
      'AWS', 'Machine Learning', 'Artificial Intelligence', 'Deep Learning',
      'API Development', 'NoSQL', 'SQL', 'Linux',
    ]);

    // ── Tier 1: Dictionary Match (Exact & Aliases) ──
    const sortedKeys = [..._lookup.keys()].sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      if (NOISE.has(key)) continue;
      if (key.length < 2) continue;

      try {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi');
        const matches = lower.match(pattern);

        if (matches && matches.length > 0) {
          const canonical = _lookup.get(key);
          if (found.has(canonical)) {
            found.get(canonical).count += matches.length;
          } else {
            const category = _categoryOf(canonical);
            found.set(canonical, { count: matches.length, category });
          }
        }
      } catch (_) { /* bad regex pattern — skip */ }
    }

    // ── Tier 2: Dynamic Pattern Discovery (Zero-shot extraction) ──
    // Highly specific heuristics to catch new tech not yet in our dictionary
    // 1. CamelCase (e.g. LangGraph, DeepSeek, CrewAI)
    // 2. Tech file extensions (e.g. Vue.js, deno.ts, utils.py)
    // 3. Known tech suffixes (e.g. MLOps, PineconeDB, GenAI)
    // 4. Versioned initialisms/models (e.g. GPT-4o, Llama-3.1, Claude-3)
    const DYNAMIC_TECH_PATTERN = /\b([A-Z][a-z]+[A-Z][A-Za-z]+|[a-zA-Z0-9]+(?:\.js|\.ts|\.py|\.rs|\.go)|[A-Z][a-zA-Z]*(?:DB|Ops|AI|ML|JS|SQL|Hub)|[A-Za-z]+-[0-9]+(?:\.[0-9]+)*[a-z]*)\b/g;
    
    // Very strict dictionary of false positives for this pattern
    const DYNAMIC_NOISE = new Set([
      'youtube', 'linkedin', 'github', 'mcdonalds', 'whatsapp', 'powerpoint', 'macbook', 
      'javascript', 'typescript', 'fullstack', 'fullstackfullstack', 'opportunityjoin', 'glassdoor'
    ]);

    const dynamicMatches = text.match(DYNAMIC_TECH_PATTERN) || [];
    for (let rawMatch of dynamicMatches) {
      let cleanMatch = rawMatch.replace(/^[-_]+|[-_]+$/g, '');
      let cleanLower = cleanMatch.toLowerCase();

      if (NOISE.has(cleanLower) || DYNAMIC_NOISE.has(cleanLower)) continue;
      
      // Check if already found via dictionary
      let alreadyFoundObj = [...found.keys()].find(k => k.toLowerCase() === cleanLower);
      
      if (alreadyFoundObj) {
        found.get(alreadyFoundObj).count += 1;
      } else if (!_lookup.has(cleanLower)) {
        // Discovered a new skill
        found.set(cleanMatch, { count: 1, category: 'discovered' });
        // Temporarily cache in lookup for this run to merge casing
        _lookup.set(cleanLower, cleanMatch); 
      }
    }

    // Remove noise (safety net)
    for (const [skill] of found) {
      if (NOISE.has(skill.toLowerCase())) found.delete(skill);
    }

    // ── Specificity scoring ──
    function _specificityWeight(canonical) {
      if (GENERIC_BROAD.has(canonical)) return 0.6;
      if (found.get(canonical) && found.get(canonical).category === 'discovered') return 1.8;
      const words = canonical.trim().split(/\s+/).length;
      if (words >= 2) return 2.0;     
      if (canonical.length > 8) return 1.5; 
      return 1.0;
    }

    // If a broad term's specific variant also matched, downgrade the broad one further
    const canonicalSet = new Set(found.keys());
    function _hasSpecificVariant(canonical) {
      const prefixes = { 'AWS': 'AWS ', 'Machine Learning': 'Learning' };
      const prefix = prefixes[canonical];
      if (!prefix) return false;
      for (const c of canonicalSet) {
        if (c !== canonical && c.startsWith(prefix)) return true;
      }
      return false;
    }

    // Build final scored list
    const scored = [...found.entries()].map(([skill, meta]) => {
      let weight = _specificityWeight(skill);
      if (_hasSpecificVariant(skill)) weight *= 0.3; 
      return { skill, count: meta.count, score: meta.count * weight, category: meta.category };
    });

    // Sort by score DESC, then alphabetically
    scored.sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));

    return scored.slice(0, maxSkills);
  }

  /**
   * Find which category a canonical skill belongs to.
   * @param {string} canonical
   * @returns {string}
   */
  function _categoryOf(canonical) {
    for (const [cat, list] of Object.entries(SKILLS)) {
      if (list.includes(canonical)) return cat;
    }
    return 'other';
  }

  /**
   * Friendly label for a category key.
   * @param {string} cat
   * @returns {string}
   */
  function categoryLabel(cat) {
    const labels = {
      languages: 'Languages',
      frontend: 'Frontend',
      backend: 'Backend',
      cloud: 'Cloud',
      devops: 'DevOps',
      databases: 'Databases',
      ai_ml: 'AI / ML',
      data_engineering: 'Data Engineering',
      mobile: 'Mobile',
      security: 'Security',
      design: 'Design',
      soft_skills: 'Soft Skills',
      discovered: 'Discovered',
      other: 'Other',
    };
    return labels[cat] || cat;
  }

  return { extractSkills, categoryLabel, SKILLS, ALIASES };
})();

// Export for use in content.js / popup.js
if (typeof module !== 'undefined') module.exports = JobOSSkillsDB;

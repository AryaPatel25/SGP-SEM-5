// seedfirestore.js
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig.node.js";

// Seed Interview Domains
const seedInterviewDomains = async () => {
  const domains = [
    {
      name: "Frontend Development",
      questions: [
        {
          question: "What are the key differences between React and Angular?",
          answer:
            "React is a library focused on building UI components, while Angular is a full-fledged framework that offers more built-in features like dependency injection, routing, etc.",
        },
        {
          question:
            "How do you optimize web performance in a React application?",
          answer:
            "Techniques include code splitting, lazy loading, memoization, and using production builds with minified code.",
        },
        {
          question: "Explain the virtual DOM and how React uses it.",
          answer:
            "The virtual DOM is a lightweight in-memory representation of the real DOM. React updates it and then efficiently reconciles it with the actual DOM.",
        },
        {
          question:
            "What is the role of webpack in modern frontend development?",
          answer:
            "Webpack bundles JavaScript files for usage in a browser and can also transform or bundle other assets like HTML, CSS, and images.",
        },
        {
          question: "How do you manage state in a large React application?",
          answer:
            "By using state management libraries like Redux, Zustand, or the Context API in combination with hooks.",
        },
      ],
    },
    {
      name: "Backend Development",
      questions: [
        {
          question: "What is RESTful API and how does it work?",
          answer:
            "A RESTful API follows the REST architectural style using HTTP methods like GET, POST, PUT, DELETE to interact with resources.",
        },
        {
          question: "Explain how authentication and authorization differ.",
          answer:
            "Authentication verifies identity, whereas authorization determines access rights.",
        },
        {
          question: "What are some common ways to secure a Node.js API?",
          answer:
            "Using HTTPS, rate limiting, input validation, JWT for authentication, and secure headers.",
        },
        {
          question: "How does a load balancer work?",
          answer:
            "It distributes incoming network traffic across multiple servers to ensure reliability and performance.",
        },
        {
          question: "What are the differences between SQL and NoSQL databases?",
          answer:
            "SQL databases are relational and use structured schemas, while NoSQL databases are non-relational and handle unstructured data.",
        },
      ],
    },
    {
      name: "Data Science",
      questions: [
        {
          question: "What is overfitting and how can you prevent it?",
          answer:
            "Overfitting is when a model performs well on training data but poorly on unseen data. It can be prevented using regularization, cross-validation, or simplifying the model.",
        },
        {
          question:
            "Explain the difference between supervised and unsupervised learning.",
          answer:
            "Supervised learning uses labeled data, while unsupervised learning finds patterns in unlabeled data.",
        },
        {
          question:
            "What are some common preprocessing techniques in machine learning?",
          answer:
            "Normalization, standardization, handling missing values, and encoding categorical variables.",
        },
        {
          question: "What is PCA and how is it used?",
          answer:
            "Principal Component Analysis reduces dimensionality by projecting data onto principal components.",
        },
        {
          question: "How do you handle missing data in a dataset?",
          answer:
            "By imputing values, removing rows/columns, or using models that handle missing data.",
        },
      ],
    },
    {
      name: "DevOps",
      questions: [
        {
          question: "What is CI/CD and why is it important?",
          answer:
            "CI/CD automates code integration, testing, and deployment to deliver software quickly and reliably.",
        },
        {
          question: "Explain Infrastructure as Code (IaC).",
          answer:
            "IaC is managing infrastructure using code, making environments consistent and easily reproducible.",
        },
        {
          question: "How do you monitor applications in production?",
          answer:
            "Use tools like Prometheus, Grafana, ELK Stack, or Datadog to monitor performance and logs.",
        },
        {
          question:
            "What are containers and how do Docker and Kubernetes help?",
          answer:
            "Containers package applications with dependencies. Docker manages containers; Kubernetes orchestrates them across clusters.",
        },
        {
          question: "How do you handle rollbacks in deployment?",
          answer:
            "Keep older versions ready and use strategies like blue-green deployments or canary releases.",
        },
      ],
    },
    {
      name: "Mobile Development",
      questions: [
        {
          question:
            "What are the differences between native and cross-platform mobile development?",
          answer:
            "Native development uses platform-specific languages (Swift/Kotlin), while cross-platform (React Native/Flutter) shares code across platforms.",
        },
        {
          question: "How does React Native differ from Flutter?",
          answer:
            "React Native uses JavaScript and native components. Flutter uses Dart and renders via its own engine.",
        },
        {
          question: "What is the role of Expo in React Native development?",
          answer:
            "Expo provides tools and services to simplify building and deploying React Native apps without native code.",
        },
        {
          question: "How do you optimize performance in mobile apps?",
          answer:
            "Use FlatList for lists, minimize re-renders, reduce bundle size, and avoid unnecessary computations.",
        },
        {
          question: "How do you handle offline data storage on mobile devices?",
          answer:
            "Use AsyncStorage, SQLite, or libraries like WatermelonDB to store data locally and sync when online.",
        },
      ],
    },
    {
      name: "AI/ML Engineering",
      questions: [
        {
          question: "What is a neural network and how does it learn?",
          answer:
            "A neural network consists of layers of neurons. It learns by adjusting weights using backpropagation and gradient descent.",
        },
        {
          question: "What are activation functions and why are they used?",
          answer:
            "Activation functions add non-linearity to the model, enabling it to learn complex patterns. Examples include ReLU and Sigmoid.",
        },
        {
          question: "What are the differences between CNN and RNN?",
          answer:
            "CNNs process spatial data like images; RNNs are designed for sequential data like time series or text.",
        },
        {
          question: "Explain gradient descent and its variants.",
          answer:
            "Gradient descent minimizes loss by updating weights. Variants like Adam and RMSProp improve convergence speed.",
        },
        {
          question: "How do you evaluate the performance of an ML model?",
          answer:
            "Use metrics like accuracy, precision, recall, F1-score, and AUC-ROC depending on the problem type.",
        },
      ],
    },
  ];

  for (const domain of domains) {
    const domainRef = doc(collection(db, "interview_domains"));
    await setDoc(domainRef, {
      name: domain.name,
      descriptiveQuestions: domain.questions, // changed from 'questions' to 'descriptiveQuestions'
    });
    console.log(`Added domain: ${domain.name}`);
  }
};

// Optional: Seed Sample User
const seedSampleUser = async () => {
  const userId = "demo-user-001";
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    name: "Demo User",
    email: "demo@example.com",
    recentInterviews: [],
    createdAt: new Date(),
  });
  console.log(`Added sample user: ${userId}`);
};

// Run Seeder
const runSeeder = async () => {
  await seedInterviewDomains();
  await seedSampleUser();
  console.log("Firestore seeding complete.");
};

runSeeder().catch(console.error);

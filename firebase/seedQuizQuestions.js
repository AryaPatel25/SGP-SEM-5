// seedQuizQuestions.js
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig.node.js";

// Quiz questions for each domain
const quizData = [
  {
    name: "Frontend Development",
    quizQuestions: [
      {
        question: "Which of the following is a React hook?",
        options: ["useState", "setInterval", "addEventListener", "querySelector"],
        answer: "useState"
      },
      {
        question: "What does CSS stand for?",
        options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Syntax", "Colorful Style Sheets"],
        answer: "Cascading Style Sheets"
      }
    ]
  },
  {
    name: "Backend Development",
    quizQuestions: [
      {
        question: "Which HTTP method is used to update a resource?",
        options: ["GET", "POST", "PUT", "DELETE"],
        answer: "PUT"
      },
      {
        question: "Which of these is a NoSQL database?",
        options: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"],
        answer: "MongoDB"
      }
    ]
  },
  {
    name: "Data Science",
    quizQuestions: [
      {
        question: "Which technique reduces dimensionality?",
        options: ["PCA", "SVM", "KNN", "CNN"],
        answer: "PCA"
      },
      {
        question: "Which is a supervised learning algorithm?",
        options: ["K-Means", "PCA", "Linear Regression", "t-SNE"],
        answer: "Linear Regression"
      }
    ]
  },
  {
    name: "DevOps",
    quizQuestions: [
      {
        question: "What does CI/CD stand for?",
        options: ["Continuous Integration/Continuous Deployment", "Code Integration/Code Delivery", "Continuous Improvement/Continuous Design", "Code Inspection/Code Debugging"],
        answer: "Continuous Integration/Continuous Deployment"
      },
      {
        question: "Which tool is used for container orchestration?",
        options: ["Docker", "Kubernetes", "Jenkins", "Git"],
        answer: "Kubernetes"
      }
    ]
  },
  {
    name: "Mobile Development",
    quizQuestions: [
      {
        question: "Which language is used for Android native development?",
        options: ["Swift", "Kotlin", "Dart", "JavaScript"],
        answer: "Kotlin"
      },
      {
        question: "Which framework is used for cross-platform mobile apps?",
        options: ["React Native", "Spring", "Express", "Laravel"],
        answer: "React Native"
      }
    ]
  },
  {
    name: "AI/ML Engineering",
    quizQuestions: [
      {
        question: "Which function is used as an activation function?",
        options: ["ReLU", "SELECT", "JOIN", "GROUP BY"],
        answer: "ReLU"
      },
      {
        question: "Which is a type of neural network for sequential data?",
        options: ["CNN", "RNN", "GAN", "SVM"],
        answer: "RNN"
      }
    ]
  }
];

const seedQuizQuestions = async () => {
  for (const domain of quizData) {
    // Find the domain document by name
    const domainQuery = collection(db, "interview_domains");
    // Sanitize domain name for Firestore doc ID
    const safeId = domain.name.replace(/[\\/#?%. ]+/g, "-").toLowerCase();
    const domainRef = doc(domainQuery, safeId);
    await setDoc(domainRef, { name: domain.name, quizQuestions: domain.quizQuestions }, { merge: true });
    console.log(`Added quiz questions to domain: ${domain.name}`);
  }
};

seedQuizQuestions().then(() => {
  console.log("Quiz questions seeding complete.");
}).catch(console.error); 
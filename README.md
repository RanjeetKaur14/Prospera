# Prospera

Gamified Financial Learning Platform

Prospera is a gamified financial education platform designed to make financial literacy interactive and engaging. The system combines a modern web interface, machine learning based financial analysis, and structured learning modules to help users understand financial concepts through practical interaction.

The project consists of a React-based frontend, a Python backend serving a machine learning model, and Firebase services for data handling.

---

# Features

* Gamified financial learning interface
* Course-based financial skill development
* Financial analytics dashboard
* Expense prediction using a trained machine learning model
* Firebase integration for data services
* Modular frontend component architecture

---

# Tech Stack

Frontend
React
Tailwind CSS
JavaScript

Backend
Python
FastAPI / Uvicorn server

Machine Learning
Scikit-learn model serialized with Pickle

Services
Firebase

---

# Project Structure

```
Prospera
│
├── backend
│   ├── model
│   │   ├── Personal_Finance_Dataset.csv
│   │   ├── expense_model.pkl
│   │   ├── expense_model_features.pkl
│   │   └── expense_predict.ipynb
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── App.js
│   │   ├── firebase.js
│   │   └── index.js
│   │
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

# Installation

Clone the repository

```
git clone https://github.com/RanjeetKaur14/Prospera.git
cd Prospera
```

---

# Running the Frontend

Navigate to the frontend directory

```
cd frontend
```

Install dependencies

```
npm install
```

Start the development server

```
npm start
```

The frontend will run on

```
http://localhost:3000
```

---

# Running the Backend

Navigate to the backend directory

```
cd backend
```

Create a Python virtual environment

```
python -m venv venv
```

Activate the virtual environment

Windows

```
venv\Scripts\activate
```

Linux / Mac

```
source venv/bin/activate
```

Install dependencies

```
pip install -r requirements.txt
```

Start the backend server using Uvicorn

```
uvicorn main:app --reload
```

The backend API will start locally and serve the machine learning prediction endpoints.

---

# Machine Learning Model

The backend includes a trained model used for financial expense prediction.

Model files used

* expense_model.pkl
* expense_model_features.pkl
* Personal_Finance_Dataset.csv

These files are loaded by the backend server to generate predictions.

---
Ranjeet Kaur
https://github.com/RanjeetKaur14

Sriza Goel
https://github.com/SrizaGoel

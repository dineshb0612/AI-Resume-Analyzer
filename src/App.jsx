import "./App.css";
import { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [direction, setDirection] = useState("en-hi");
  const [loading, setLoading] = useState(false);

  const [score, setScore] = useState("");
  const [missingSkills, setMissingSkills] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("resumeHistory")) || []
  );

  const analyzeResume = async () => {
    try {
      if (!file) {
        alert("Please select a resume PDF.");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      formData.append("resume", file);
      formData.append("job_description", jobDescription);

    const response = await axios.post(
     "http://127.0.0.1:5000/analyze",
     formData
     );
     console.log(response.data);

     setScore(response.data.score || "");

     setMissingSkills(
     response.data.missing_skills || []
     );

     setSuggestions(
     response.data.suggestions || []
     );

      const newHistory = [
        {
          name: file.name,
          score: response.data.score || 0,
          date: new Date().toLocaleString(),
        },
        ...history,
      ].slice(0, 5);

      setHistory(newHistory);

      localStorage.setItem(
        "resumeHistory",
        JSON.stringify(newHistory)
      );

      setDirection("en-hi");
    } catch (error) {
      console.error(error);

      setScore("");
      setMissingSkills([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const translateToggle = async () => {
    try {
      await axios.post(
        "http://127.0.0.1:5000/translate",
        {
          text: JSON.stringify({
            score,
            missingSkills,
            suggestions,
          }),
          direction,
        }
      );

      alert(
        "Translation feature currently works on text output only."
      );

      setDirection(
        direction === "en-hi"
          ? "hi-en"
          : "en-hi"
      );
    } catch (error) {
      console.error(error);
    }
  };

  const removeResume = () => {
    setFile(null);
    setScore("");
    setMissingSkills([]);
    setSuggestions([]);
    setDirection("en-hi");
  };
  const deleteHistory = (index) => {
  const updatedHistory = history.filter(
    (_, i) => i !== index
  );

  setHistory(updatedHistory);

  localStorage.setItem(
    "resumeHistory",
    JSON.stringify(updatedHistory)
  );
};

  return (
    <div className="container">
      <h1>AI Resume Analyzer</h1>

      <input
        key={file ? file.name : "empty"}
        type="file"
        accept=".pdf"
        onChange={(e) =>
          setFile(e.target.files[0])
        }
      />

      <br />
      <br />

      {file && (
        <>
          <p>
            <strong>Selected:</strong> {file.name}
          </p>

          <button onClick={removeResume}>
            Remove Resume
          </button>

          <div className="resume-card">
            <strong>Resume:</strong> {file.name}
          </div>

          <br />
          <br />
        </>
      )}

      <textarea
        placeholder="Paste Job Description Here"
        rows={8}
        value={jobDescription}
        onChange={(e) =>
          setJobDescription(e.target.value)
        }
      />

      <br />
      <br />

      <button
        onClick={analyzeResume}
        disabled={loading}
      >
        {loading
          ? "Analyzing..."
          : "Analyze Resume"}
      </button>

      <button
        onClick={translateToggle}
        style={{ marginLeft: "10px" }}
      >
        {direction === "en-hi"
          ? "Translate To Hindi"
          : "Translate To English"}
      </button>

      {score !== "" && (
        <div className="score-card">
          <h2>ATS Score</h2>

          <div className="score-value">
            {score}%
          </div>
        </div>
      )}

      {missingSkills.length > 0 && (
        <div className="card">
          <h2>Missing Skills</h2>

          <ul>
            {missingSkills.map(
              (skill, index) => (
                <li key={index}>
                  {skill}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <h2>Resume History</h2>

          {history.map((item, index) => (
            <div
              key={index}
              className="history-item"
            >
              <div>
                <strong>{item.name}</strong>
                <br />
                <small>{item.date}</small>
              </div>
             <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }}
>
  <div className="history-score">
    {item.score}%
  </div>

  <button
    onClick={() => deleteHistory(index)}
    style={{
      background: "red",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      padding: "5px 10px",
    }}
  >
    ❌
  </button>
</div>
              
            </div>
          ))}
        </div>
      )}

      
      {suggestions.length > 0 && (
        <div className="card">
          <h2>Improvement Suggestions</h2>

          <ul>
            {suggestions.map(
              (item, index) => (
                <li key={index}>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      <div className="footer">
        Built with React + Flask + Groq AI
      </div>
    </div>
  );
}

export default App;
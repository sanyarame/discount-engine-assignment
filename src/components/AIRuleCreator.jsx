import { useState } from "react";

export default function AIRuleCreator({ onRuleCreated }) {
  const [prompt, setPrompt] = useState("");
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateRule() {
    if (!prompt.trim()) {
      setError("Please enter a discount request.");
      return;
    }

    setLoading(true);
    setError("");
    setRule(null);

    try {
      const apiUrl = import.meta.env.DEV ? "http://localhost:3001/api/generate-rule" : "/api/generate-rule";
const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate rule.");
      }

      let parsed;

      try {
        let text = data.result.trim();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(text);
      } catch {
        throw new Error("The AI returned an invalid rule. Please try again.");
      }

      if (parsed.error) {
        throw new Error(parsed.error);
      }
      console.log("AI generated rule:", parsed);

      if (
  !["brand", "platform", "cart"].includes(parsed.scope) ||
  !["percentage", "flat"].includes(parsed.type) ||
  parsed.value <= 0
) {
  throw new Error(
  `Invalid values: scope=${parsed.scope}, type=${parsed.type}, value=${parsed.value}`
);
}

if (parsed.scope === "cart") {
  if (
    typeof parsed.min_cart_value !== "number" ||
    parsed.min_cart_value <= 0
  ) {
    throw new Error("Cart rules must include a valid minimum cart value.");
  }
}

      
      if (parsed.type === "percentage" && parsed.value > 100) {
        throw new Error("Percentage discount cannot exceed 100%.");
      }

      console.log("PARSED AI RESPONSE:", parsed);
console.log("VALIDATION:", parsed.scope, parsed.type, parsed.value, parsed.min_cart_value);
setRule(parsed);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function confirmRule() {
    if (onRuleCreated) {
      onRuleCreated(rule);
    }
    setRule(null);
    setPrompt("");
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "24px",
      }}
    >
      <h2>AI Discount Rule Creator</h2>

      <p>
        Describe the discount you want in plain English and let AI convert it
        into a structured rule.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='Example: Give Natura Casa 20% off, non-stackable'
        rows={4}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={generateRule}
        disabled={loading}
        style={{
          marginTop: "12px",
          padding: "10px 16px",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Generating rule..." : "Generate Rule"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "12px" }}>
          {error}
        </p>
      )}

      {rule && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "#f7f7f7",
            borderRadius: "10px",
          }}
        >
          <h3>Rule Preview</h3>

          <p>
            <strong>Scope:</strong> {rule.scope}
          </p>

          <p>
            <strong>Applies to:</strong> {rule.appliesTo}
          </p>
          {rule.scope === "cart" && (
  <p>
    <strong>Minimum cart value:</strong> ₹{rule.min_cart_value}
  </p>
)}

          <p>
            <strong>Discount:</strong> {rule.value}
            {rule.type === "percentage" ? "%" : " flat"}
          </p>

          <p>
            <strong>Stackable:</strong>{" "}
            {rule.stackable ? "Yes" : "No"}
          </p>

          <button
            onClick={confirmRule}
            style={{
              marginTop: "12px",
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Confirm Rule
          </button>

          <button
            onClick={() => setRule(null)}
            style={{
              marginLeft: "10px",
              marginTop: "12px",
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
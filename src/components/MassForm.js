import React, { useState } from "react";

function MassForm() {
  // State to store the uploaded files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // State to manage the submit button's state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle file selection
  const handleFileChange = (event) => {
    // Set the selected files into the state
    setUploadedFiles([...event.target.files]);
  };

  // Convert file to Base64
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Convert all files to Base64
    const filesBase64 = await Promise.all(
      uploadedFiles.map(async (file) => {
        const base64 = await convertToBase64(file);
        return base64.split(",")[1]; // Extract only the base64 content
      })
    );

    // Prepare the payload for the API call
    const payload = {
      files: filesBase64.map((base64, index) => ({
        name: uploadedFiles[index].name,
        content: base64,
      })),
    };

    console.log("payload", JSON.stringify(payload));

    // API call to submit the files
    fetch("https://api-flask-24p3.onrender.com/extract_text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        // Handle success response
      })
      .catch((error) => {
        console.error("Error:", error);
        // Handle errors here
      });

    setIsSubmitting(false);
  };

  return (
    <>
      <h2>Importer les CVs</h2>
      <input type="file" onChange={handleFileChange} multiple />
      {uploadedFiles.length > 0 && (
        <div>
          <h3>Files:</h3>
          <ul>
            {Array.from(uploadedFiles).map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          <button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </>
  );
}

export default MassForm;

import React, { useState, useRef, useEffect } from "react";
import { RotatingLines, ThreeDots } from "react-loader-spinner";
import "./Form.module.css";
import "./styles.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast, Bounce } from "react-toastify";
import axios from "axios";

function Form() {
  /*. When you call useState, you get back a pair: the current
     state value and a function that lets you update it. */
  const [lead, setLead] = useState({
    lastName: "",
    email: "",
    Phone: "",
    typeCandidat: "",
    jobId: "",
    recordType: "0127Q000000hMldQAE",
    lastEstablishment__c: "",
    LinkedInAccount__c: "",
    yearOfExperience__c: "",
    Skills: [],
    Certifications: [],

    extractedData: {
      langues: [],
    },
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [fileName, setFileName] = useState(""); 
  const [message, setMessage] = useState(" ");
  const [email, setEmail] = useState("yourmail@mail.com");
  const [phoneError, setPhoneError] = useState("");
  const [experienceError, setExperienceError] = useState("");

  //let extracted = false;

  const certifications = [
    "Salesforce Certified Administrator",
    "Salesforce Certified Advanced Administrator",
    "Salesforce Certified Platform Developer I",
    "Salesforce Certified Platform Developer II",
    "Salesforce Certified JavaScript Developer I",
    "Service Cloud Consultant",
    "Experience Cloud Consultant",
    "Sales Cloud Consultant",
  ];
  useEffect(() => {
    console.log("Updated lead:", lead);
  }, [lead]);

  const skillTypes = ["Programming", "Soft", "Language"];

  const educationalLevel = ["Licence", "Master", "Phd"];

  // const displayNames = {
  //   Name: "Name",
  //   contactNumber: "Phone",
  //   email: "Email",
  //   langues: "Langues",
  //   skills: "Skills",
  //   softSkills: "Soft Skills",
  // };

  function handleChange(e) {
    const { name, value } = e.target;
    const re = /^[0-9\b]+$/;

    if (name === "email") {
      console.log("heloo");
      setEmail(value);
      let emailRegex = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/;

      setLead({ ...lead, [name]: value });
      console.log(!emailRegex.test(value));
      if (!emailRegex.test(value)) {
        setMessage("Error! you have entered invalid email.");
        console.log("message", message);
      } else {
        setMessage("");
      }
    } else if (name === "Phone") {
      const cleanedValue = value.replace(/\s+/g, "");
      console.log("cleanedValue", cleanedValue);
      const isNumeric = re.test(cleanedValue);
      const isValidLength =
        cleanedValue.length === 10 || cleanedValue.length === 12;

      // Set the error message if the value is not numeric or not the right length
      if (!isNumeric) {
        setPhoneError("Phone number must contain only numeric values.");
      } else if (!isValidLength) {
        setPhoneError("Phone number must have 10 or 12 digits.");
      } else {
        setPhoneError(""); // Clear error message when the phone is valid
      }
    }
    if (name === "yearOfExperience__c") {
      const cleanedValue = value.replace(/\s+/g, "");
      if (!re.test(cleanedValue)) {
        setExperienceError(
          "Year of experience  must contain only numeric values."
        );
      } else {
        setExperienceError("");
      }
    }
    setLead({ ...lead, [name]: value });
    console.log("leaaaaaaaad", lead);
  }
  // Reference for the file input
  const fileInputRef = useRef();

  function appendFileToFormData(formData) {
    const file = fileInputRef.current.files[0];
    if (file) {
      formData.append("cv", file);
    }
  }
  function handleSubmit(e) {
    console.log("called");
    e.preventDefault(); // Prevent default form submission behavior
    console.log("heloo", !isExtracted);
    if (!isExtracted) {
      console.log("heloo");
      toast.error("Please Verify your data before submitting", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }
    console.log("certification", lead.Certifications);

    // Construct the endpoint URL
    const endpoint = "http://localhost:3001/submit-form";
    const formData = new FormData();
    console.log("op", lead);
    // Append each lead property to the formData object
    // for (const key in lead) {
    //   formData.append(key, lead[key]);
    // }
    if (lead.jobId === "a0Y9O0000003TS5UAM") {
      formData.append("jobName", "Associate");
    } else if (lead.jobId === "a0Y9O0000003lFJUAY") {
      formData.append("jobName", "Consultant");
    }
    console.log("educationalLevel__c", lead.educationalLevel__c);
    console.log("yearOfExperience__c", lead.yearOfExperience__c);
    formData.append("educationalLevel__c", lead.educationalLevel__c);
    formData.append("yearOfExperience__c", lead.yearOfExperience__c);
    formData.append("LinkedInAccount__c", lead.LinkedInAccount__c);
    formData.append("lastEstablishment__c", lead.lastEstablishment__c);
    formData.append("lastName", lead.lastName);
    formData.append("email", lead.email);
    formData.append("Phone", lead.Phone);
    formData.append("typeCandidat", lead.typeCandidat);
    formData.append("jobId", lead.jobId);
    formData.append("recordType", lead.recordType);

    if (lead.Certifications.length === 0) {
      formData.append("CertificationsEmpty", "true");
    } else {
      lead.Certifications.forEach((certification, index) => {
        formData.append(`Certifications[${index}][name]`, certification.type);
        formData.append(`Certifications[${index}][type]`, certification.type);
        //formData.append(`Certifications[${index}][date]`, certification.date);
      });
    }
    // Append each skill object as a separate entry in the FormData
    lead.Skills.forEach((skill, index) => {
      if (skill.name.trim() !== "") {
        formData.append(`Skills[${index}][name]`, skill.name);
        formData.append(`Skills[${index}][type]`, skill.type);
      }
    });

    appendFileToFormData(formData);

    // Use fetch API to send the data to the server
    fetch(endpoint, {
      method: "POST",
      body: formData, // Send the form data as the request body
    })
      .then((response) => {
        return response.json().then((data) => {
          if (!response.ok) {
            if (response.status === 400) {
              // If the response indicates failure, throw an error with details from the data
              throw new Error(data.errorMessage);
            }
          }
          // If the response is ok, just return the data for further processing
          return data;
        });
      })
      .then((data) => {
        console.log("Success:", data);
        toast.success("Registered!", {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
  
      })
      .catch((error) => {
        // Handle errors that have been thrown with detailed information
        console.error("Error:", error.message);
        // Display an error notification
        toast.error('Error occured while submtting the form', {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          transition: Bounce,
        });
      });
  }

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(event.target.files[0]);
    setFileName(file ? file.name : "");
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    console.log("CALLED___");
    if (!selectedFile) {
      toast.error("You must upload your resume ", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }
    setIsExtracted(true);
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      //https://api-flask-24p3.onrender.com/extract_text
      //http://127.0.0.1:5000/extract_text
      const response = await axios.post(
        "https://api-flask-24p3.onrender.com/extract_text",
        formData
      );

      console.log("dataaa", JSON.parse(JSON.stringify(response.data)));

      //concatenate lists of skills
      // const skills = response.data.skills.concat(
      //   response.data["soft skills"],
      //   response.data.langues
      // );

      // Check if the arrays exist and are not empty before mapping
      const programmingSkills = Array.isArray(response.data.skills)
        ? response.data.skills.map((skill) => ({
            name: skill,
            type: "Programming",
          }))
        : [];

      const softSkills = Array.isArray(response.data["soft skills"])
        ? response.data["soft skills"].map((skill) => ({
            name: skill,
            type: "Soft",
          }))
        : [];

      const languages = Array.isArray(response.data.langues)
        ? response.data.langues.map((language) => ({
            name: language,
            type: "Language",
          }))
        : [];

      // Concatenate all the skills into one array, handling even if some are empty
      const skillsWithTypes = [
        ...programmingSkills,
        ...softSkills,
        ...languages,
      ];

      //const skillsWithTypes = response.data.skills.map(skillName => ({ name: skillName, type: '' }));
      // const skillsWithTypes = Array.isArray(skills)
      //   ? skills.map((skillName) => ({
      //       name: skillName,
      //       type: "",
      //     }))
      //   : [];

      const certifFull = Array.isArray(response.data.certifications)
        ? response.data.certifications.map((certif) => ({
            name: certif,
            type: "",
            //date:'',
          }))
        : [];

      // setLead({ ...lead, extractedData: response.data ,skillsType: skillsWithTypes, });// Transform the skills array
      // Transform the skills into a structure with types, if necessary

      setLead((prevLead) => ({
        ...prevLead,
        lastName: response.data.Name,
        email: response.data.email,
        Phone: response.data["contact number:"],
        Skills: skillsWithTypes,
        Certifications: certifFull,
        extractedData: {
          ...prevLead.extractedData,
          ...response.data,
        },
      }));
      console.log("set lead", JSON.parse(JSON.stringify(lead)));
      setShowDetails(true);
    } catch (error) {
      console.error("Error:", error.message);
    }
    setIsLoading(false);
  };

  const updateCertificationName = (index, newCertification) => {
    console.log("am updated!!!!!");
    setLead((prevLead) => {
      // Clone the Certifications array
      const updatedCertifications = [...prevLead.Certifications];

      // Update the specific certification at the index
      updatedCertifications[index] = newCertification;
      console.log("updatedCertifications ", updatedCertifications[index]);
      // Return the updated state
      return { ...prevLead, Certifications: updatedCertifications };
    });
  };

  /*
  const updateCertificationDate = (index, newDate) => {
    setLead((prevLead) => {
      const updatedCertifications = prevLead.Certifications.map((certification, idx) => {
        if (idx === index) {
          return { ...certification, date: newDate };
        }
        return certification;
      });
      return { ...prevLead, Certifications: updatedCertifications };
    });
  };*/

  const handleCertifTypeChange = (index, selectedType) => {
    console.log("certif type", selectedType);
    setLead((prevLead) => {
      const updatedCertifs = prevLead.Certifications.map(
        (certif, skillIndex) => {
          if (skillIndex === index) {
            return { ...certif, type: selectedType };
          }

          return certif;
        }
      );

      return {
        ...prevLead,

        Certifications: updatedCertifs,
      };
    });
  };

  const handleSkillTypeChange = (index, selectedType) => {
    console.log("skill type", selectedType);
    setLead((prevLead) => {
      const updatedSkills = prevLead.Skills.map((skill, skillIndex) => {
        if (skillIndex === index) {
          return { ...skill, type: selectedType };
        }

        return skill;
      });

      return {
        ...prevLead,

        Skills: updatedSkills,
      };
    });
  };
  const updateSkillName = (index, newName) => {
    setLead((prevLead) => {
      const updatedSkills = prevLead.Skills.map((skill, idx) => {
        if (idx === index) {
          return { ...skill, name: newName };
        }
        return skill;
      });
      return { ...prevLead, Skills: updatedSkills };
    });
  };

  const addSkill = () => {
    const newSkill = { name: "", type: "" };
    console.log("newSkill.name ", newSkill.name);
    setLead((prevLead) => ({
      ...prevLead,
      Skills: [...prevLead.Skills, newSkill],
    }));
  };
  const addCertification = () => {
    setLead((prevLead) => ({
      ...prevLead,
      Certifications: [...prevLead.Certifications, { name: "", type: "" }],
    }));
  };

  return (
    // bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/conference.jpg')]
    // bg-gradient-to-r from-cyan-500 to-blue-500
    // <section className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:bg-gray-900 min-h-screen">
    //      className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:bg-gray-900 min-h-screen"

    <section
      // style={{
      //   backgroundImage: "url('/header.png')",
      //   backgroundRepeat: "no-repeat",
      //   backgroundSize:"cover"
      // }}
      className="mt-12"
    >
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0 overflow-auto ">
        <div className="w-full bg-white rounded-lg shadow dark:border mt-6px  max-w-4xl	xl:p-0 dark:bg-gray-800 dark:border-gray-700   ">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl dark:text-white ml-72">
              New candidate
            </h1>
            <ToastContainer />
            <form
              className="space-y-4 md:space-y-6"
              encType="multipart/form-data"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-wrap -mx-3 mb-2">
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6">
                  <label
                    htmlFor="typeCandidat"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Type de candidat{" "}
                  </label>
                  <select
                    name="typeCandidat"
                    value={lead.typeCandidat}
                    onChange={handleChange}
                    id="typeCandidat"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="helo" hidden>
                      Select candidate type
                    </option>
                    <option value="Intern">Intern</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6 b">
                  <label
                    htmlFor="job"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Job
                  </label>
                  <select
                    name="jobId"
                    value={lead.jobId}
                    onChange={handleChange}
                    id="job"
                    className="bg-gray-50 border  border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="" hidden>
                      Select a job{" "}
                    </option>
                    <option value="a0Y9O0000003TS5UAM">Associate</option>
                    <option value="a0Y9O0000014nSzUAI">
                      Technical Consultant - Commerce Cloud
                    </option>
                    <option value="a0Y9O0000003lFJUAY">
                      Technical Consultant - Sales Cloud
                    </option>
                  </select>
                </div>
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6 b">
                  <label
                    htmlFor="job"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    School / Company
                  </label>
                  <input
                    onChange={handleChange}
                    value={lead.lastEstablishment__c}
                    className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    name="lastEstablishment__c"
                  />
                </div>
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6 b">
                  <label
                    htmlFor="job"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Linkedin Account
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    pattern="https://.*"
                    onChange={handleChange}
                    value={lead.LinkedInAccount__c}
                    className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    name="LinkedInAccount__c"
                  />
                </div>
                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6 b">
                  <label
                    htmlFor="job"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Year of Experience
                  </label>
                  <input
                    type="text"
                    onChange={handleChange}
                    value={lead.yearOfExperience__c}
                    className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    name="yearOfExperience__c"
                  />

                  <div className="text-red-500 text-sm mt-1">
                    {experienceError}
                  </div>
                </div>

                <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6 b">
                  <label
                    htmlFor="job"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Educational Level
                  </label>
                  <select
                    name="educationalLevel__c"
                    value={lead.educationalLevel__c}
                    onChange={handleChange}
                    id="job"
                    className="bg-gray-50 border  border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="" hidden>
                      Select your educational level{" "}
                    </option>
                    <option value="Licence">Licence</option>
                    <option value="Master">Master</option>
                    <option value="Phd">Phd</option>
                  </select>
                </div>
              </div>
{/* 
              <label
                htmlFor="cv"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                CV
              </label>
              <input
                type="file"
                id="cv"
                name="cv"
                accept="application/pdf"
                className="input-box"
                onChange={handleFileChange}
                ref={fileInputRef}
                required
              /> */}

<label
                htmlFor="cv"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                CV
              </label>
<div class="file-upload-form">
  
  <label for="file" class="file-upload-label">
    <div class="file-upload-design">
      <svg viewBox="0 0 640 512" height="1em">
        <path
          d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z"
        ></path>
      </svg>
    
      <span class="browse-button">Upload File</span>
    </div>
  
   <input
                type="file"
                id="file"
                name="cv"
                accept="application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                required
/>
</label> 
<div className=" ml-4 font-semibold">{fileName && <p>Selected file: {fileName}</p>}</div>

<button
                className="bg-niagara-600 text-white font-semibold py-2 px-4 rounded-full mx-8 ms-40 enabled:hover:border-gray-400 disabled:opacity-75"
                type="type"
                style={{
                  backgroundColor: "#05A88B"
                }}
                onClick={handleOnSubmit}
                disabled={isLoading}
              >
                Verify my Resume
              </button>          
</div>


            

              <div className="flex justify-center items-center">
                {isLoading && (
                  // <RotatingLines
                  //   visible={true}
                  //   height="96"
                  //   width="96"
                  //   color="grey"
                  //   strokeWidth="5"
                  //   animationDuration="0.75"
                  //   ariaLabel="rotating-lines-loading"
                  //   wrapperStyle={{}}
                  //   wrapperClass=""
                  // />

                  <ThreeDots
                    visible={true}
                    height="80"
                    width="80"
                    color="#05A88B"
                    radius="9"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                  />

                  //                   <div class="wrapper">
                  //     <div className="circle"></div>
                  //     <div className="circle"></div>
                  //     <div className="circle"></div>
                  //     <div className="shadow"></div>
                  //     <div className="shadow"></div>
                  //     <div className="shadow"></div>
                  // </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap -mx-3 mb-2 ">
                  {Object.entries(lead).map(([key, values]) => {
                    // Check if the key is 'skills' to conditionally render the select box
                    if (key === "Skills") {
                      return (
                        <div key={key} className="flex flex-wrap  mb-2 w-full ">
                          {values.map((skill, index) => (
                            <div
                              key={`${key}-${index}`}
                              className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6"
                            >
                              <label className="block mb-2 ml-2 text-sm font-medium text-gray-900 dark:text-white">
                                Skill
                              </label>
                              <div className="flex center mb-2">
                                <input
                                  type="text"
                                  value={skill.name}
                                  onChange={(e) =>
                                    updateSkillName(index, e.target.value)
                                  }
                                  className="bg-gray-50 border mb-2 ml-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                <div className="flex w-72 flex-col gap-6">
                                  <select
                                    value={skill.type}
                                    onChange={(e) =>
                                      handleSkillTypeChange(
                                        index,
                                        e.target.value
                                      )
                                    }
                                    size="md"
                                    className="block  py-2.5 mx-3 mb-3 px-2  w-full text-sm text-gray-700 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-700 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
                                    //class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    variant="static"
                                    label="Select Version"
                                  >
                                    <option value="" hidden>
                                      Select skill type
                                    </option>
                                    {skillTypes.map((type, typeIndex) => (
                                      <option key={typeIndex} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div class="element">

                          {showDetails && (
                            // <button
                            //   type="button"
                            //   className=" mb-5 mt-5 ml-96 mr-0 bg-transparent hover:bg-blue-500  font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                            //   onClick={addSkill}
                            // >
                            //   Add Skill
                            // </button>

                            <button
                            type="button"
                            // className=" mb-5 mt-5 ml-96 mr-0 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                            class="buttonele"
                          >
                            Add Skill
                          </button>
                          )}
                          </div>
                        </div>
                      );
                    }

                    if (key === "Certifications") {
                      return (
                        <div
                          key={key}
                          className="flex flex-wrap  mb-2 w-full "
                        >
                          {lead.Certifications.map((certification, index) => (
                            <div
                              key={`Certification-${index}`}
                              className="w-full m px-3 mb-6 md:mb-0 "
                            >
                              <label className="block mb-2 ml-2 text-sm font-medium text-gray-900 dark:text-white">
                                Certification
                              </label>
                              <div className="flex center mb-2 ">
                                <input
                                  type="text"
                                  value={certification.name}
                                  onChange={(e) =>
                                    updateCertificationName(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="bg-gray-50 border mb-2 ml-2 w-2/5 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                <select
                                  value={certification.type}
                                  onChange={(e) =>
                                    handleCertifTypeChange(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="block  py-2.5 mx-3 mb-3 px-2  w-1/2 text-sm text-gray-700 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-700 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
                                >
                                  <option value="" hidden>
                                    Select certification type
                                  </option>
                                  {certifications.map((type, typeIndex) => (
                                    <option key={typeIndex} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                                {/* <div className="w-1/4  ">
                                <input
      type="date"
      value={certification.date}
      onChange={(e) => updateCertificationDate(index, e.target.value)}
      className="w-full mt-4"
      placeholder="Certification Date"
    />
    </div> */}
                              </div>
                            </div>
                          ))}

                          <div className="element">
                          {showDetails && (
                            // <button
                            //   type="button"
                            //   className=" ml-96 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                            //   onClick={addCertification}
                            // >
                            //   Add Certification
                            // </button>

                            <button
                            type="button"
                            className="buttonele"
                            onClick={addCertification}
                          >
                            Add Certification
                          </button>
                          )}
                        </div>
                        </div>
                      );
                    }

                    if (key === "lastName") {
                      return (
                        <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6">
                          {showDetails && (
                            <div
                              key={key}
                              // className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6"
                            >
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                {/* {displayNames[key]} */}
                                Name
                              </label>
                              <input
                                onChange={handleChange}
                                value={lead.lastName}
                                className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                name="lastName"
                              />
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (key === "email") {
                      return (
                        <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6">
                          {showDetails && (
                            <div
                              key={key}
                              // className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6"
                            >
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                {/* {displayNames[key]} */}
                                Email
                              </label>
                              <input
                                onChange={handleChange}
                                value={lead.email}
                                className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                name="email"
                                required
                              />{" "}
                              <div style={{ color: "red" }}> {message} </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (key === "Phone") {
                      return (
                        <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6">
                          {showDetails && (
                            <div
                              key={key}
                              // className="w-full md:w-1/2 px-3 mb-6 md:mb-0 mt-6"
                            >
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                {/* {displayNames[key]} */}
                                Phone
                              </label>
                              <input
                                onChange={handleChange}
                                value={lead.Phone}
                                className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                name="Phone"
                                required
                              />
                              <div className="text-red-500 text-sm mt-1">
                                {phoneError}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

            
              {showDetails && (
      <div className="w-full flex justify-center">
        <button
          type="submit"
          onSubmit={handleSubmit}
          className="w-4/5 text-white font-bold py-2 px-4 text-lg rounded mt-6"
          style={{
            backgroundColor: "#05A88B"
          }}
        >
          Submit
        </button>
      </div>
    )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Form;

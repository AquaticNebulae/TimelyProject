# Timely

Timely is a real-estate and consultant management web application designed to help admins, consultants, and clients manage projects, assignments, and reporting in one place.

This README provides:
- A clear overview of the project  
- What is completed so far  
- How to run the frontend and backend  
- Sprints documentation summary  
- Known issues and next steps  

---
##  Team Members

| Name | Role |  
|------|------|
| **Eris Jacinto** | Liaison • Database Management • Backend Developer | 
| **Jeter Ogando** | Frontend Developer | 
| **Frankie Sosa** | Documentation | 
| **Vladyslav Khodorkovsky** | Frontend Developer |
| **James Mardi** | Frontend Developer | 

## Tech Stack

### **Frontend**
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss&logoColor=white&style=for-the-badge)
- React  
- TypeScript  
- Vite  
- Tailwind CSS  

### **Backend**
![DotNet](https://img.shields.io/badge/.NET-512BD4?logo=dotnet&logoColor=white&style=for-the-badge)
![C#](https://img.shields.io/badge/C%23-239120?logo=csharp&logoColor=white&style=for-the-badge)
![SSMS](https://img.shields.io/badge/SSMS-CC2927?logo=microsoftsqlserver&logoColor=white&style=for-the-badge)
![CSV Storage](https://img.shields.io/badge/Temporary_CSV_Storage-999999?style=for-the-badge)
- .NET / C#  
- SQL Server (planned)  
- Temporary CSV file storage (current phase)  

### **Tools**
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white&style=for-the-badge)
![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=white&style=for-the-badge)
![VSCode](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge)
![Visual Studio](https://img.shields.io/badge/Visual_Studio-5C2D91?logo=visualstudio&logoColor=white&style=for-the-badge)
![Opera GX](https://img.shields.io/badge/Opera_GX-EA1754?logo=operagx&logoColor=white&style=for-the-badge)
- Node.js & npm  
- Visual Studio Code  
- Visual Studio 2022  
- Browser: Opera GX (used in testing)

---

##  Project Overview

Timely is being built to streamline:
- Client registration  
- Consultant registration  
- Admin operations  
- Project assignments  
- Email & password generation  
- Reporting (future feature)

The system is currently **in development**—major modules like Client, Admin, Consultant, and Reports are still being completed by team members.

---

## How to Run Timely

Based on the *How to run timely.pdf* steps: :contentReference[oaicite:2]{index=2}

### Clone the Repository
Open your terminal:

```bash
git clone https://github.com/AquaticNebulae/TimelyProject.git

 Running the Frontend
1. cd Timely_FrontEnd
2. npm install
3. npm run dev
```
---
##  Sprint 1 Test Results


| Component          | Expected Behavior                  | Actual Result | Pass/Fail | Notes                                       |
|--------------------|------------------------------------|--------------|-----------|---------------------------------------------|
| **Login**          | Empty input prevents navigation    | N/A          | N/A       | No final login option yet—only local testing |
| **Dashboard**      | Loads & displays navbar            | Works        | Pass      | Early version, will be expanded             |
| **Navbar**         | Opens sidebar + profile dropdown   | Works        | Pass      | Notifications not implemented yet           |
| **Sidebar**        | Shows windows                      | Works        | Pass      | Only Admin window functional                |
| **Email Generator**| Creates company email              | Works        | Pass      | Copy button works                           |
| **Password Generator** | Creates temp password          | Works        | Pass      | React import missing fix required           |

##  Sprint 2 Test Results

N/A

##  Sprint 3 Test Results
N/A

##  Project Status

### **Timely is currently in active development!**

![Status](https://img.shields.io/badge/STATUS-In_Progress-ff9800?style=for-the-badge&logo=github)
![Frontend](https://img.shields.io/badge/FRONTEND-50%25-orange?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/BACKEND-40%25-blue?style=for-the-badge&logo=dotnet)
![Database](https://img.shields.io/badge/DATABASE-Starting-red?style=for-the-badge&logo=microsoftsqlserver)
![Team](https://img.shields.io/badge/TEAM-WORKING_HARD-8BC34A?style=for-the-badge&logo=people)


##  Pictures


<h2 align="center"> Login Screen</h2>

<p align="center">
  <img 
    src="https://github.com/user-attachments/assets/03467b9f-9064-4bc2-a820-96346403f8bf" 
    alt="Login Screenshot"
    width="500"
  />
</p>
<h2 align="center"> Admin Section</h2>

<p align="center">
  <img 
    src="https://github.com/user-attachments/assets/326f63b5-c921-4487-b366-ba4088faa98d" 
    alt="Admin Screenshot"
    width="672"
  />
</p>


<h2 align="center">Home Page</h2>

<p align="center">
  <img 
    src="https://github.com/user-attachments/assets/6a19c851-06d9-45ba-8a8c-7151a91e876c"
    alt="Home Page Screenshot"
    width="650"
  />
</p>
<h2 align="center"> Project Structure</h2>

<p align="center">
  <img 
    src="https://github.com/user-attachments/assets/b4b15036-a0d1-48be-b8e1-2b01d2a068ca"
    alt="Project Structure Screenshot"
    width="350"
  />
</p>

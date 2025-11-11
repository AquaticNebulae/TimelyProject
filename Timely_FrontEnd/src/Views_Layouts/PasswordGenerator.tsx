import { useState, useRef } from "react";

export default function PasswordGenerator({
  defaultLength = 15,
  minLength = 5,
  maxLength = 25,
}: {
    defaultLength ?: number;
    minLength ?: number;
    maxLength ?: number;
}) {
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeSpecialChars, setIncludeSpecialChars] = useState(false);
    const [includeNumbers, setIncludeNumbers] = useState(false);
    const [passwordLength, setPasswordLength] = useState(defaultLength);
    const [password, setPassword] = useState("");
    const successBox = useRef<HTMLDivElement>(null);

    function shuffle(s: string) {
        return s.split("").sort(() => Math.random() - 0.5).join("");
    }

    const generatePassword = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const uppercase = lowercase.toUpperCase();
        const numbers = "0123456789";
        const specialChars = '!@#$%^&*()_-+=|;"<>.?/';

        let pool = lowercase;
        const required: string[] = [
          lowercase[Math.floor(Math.random() * lowercase.length)],
    ];

        if (includeUppercase)
        {
            pool += uppercase;
            required.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
        }
        if (includeNumbers)
        {
            pool += numbers;
            required.push(numbers[Math.floor(Math.random() * numbers.length)]);
        }
        if (includeSpecialChars)
        {
            pool += specialChars;
            required.push(specialChars[Math.floor(Math.random() * specialChars.length)]);
        }

        const len = Math.max(passwordLength, required.length);
        const rest: string[] = [];
        for (let i = 0; i < len - required.length; i++)
        {
            rest.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        setPassword(shuffle(required.concat(rest).join("")));
    }
    ;

    const copyPasswordToClipboard = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!password) return;
        navigator.clipboard.writeText(password);
        successBox.current?.classList.remove("hidden");
        setTimeout(() => successBox.current?.classList.add("hidden"), 3000);
    }
    ;

    return (
  
      < div className = "bg-white p-8 max-w-xl mx-auto rounded-3xl shadow-lg" >
  
        < form onSubmit ={ generatePassword}
    className = "space-y-6" >
  
          < h1 className = "text-2xl font-bold mb-4" > Password Generator </ h1 >

        
        < div className = "grid grid-cols-2 gap-4 max-sm:grid-cols-1" >
          < label className = "flex items-center gap-2 text-left" >
            < input
              type = "checkbox"
              checked={ includeUppercase}
    onChange ={ () => setIncludeUppercase(!includeUppercase)}
    className = "h-4 w-4"
  />
  Include Uppercase Letters
</ label >


< label className = "flex items-center gap-2 text-left" >

  < input
              type = "checkbox"
              checked={ includeSpecialChars}
    onChange ={ () => setIncludeSpecialChars(!includeSpecialChars)}
    className = "h-4 w-4"
  />
  Include Special Characters
</ label >


< label className = "flex items-center gap-2 text-left" >

  < input
              type = "checkbox"
              checked={ includeNumbers}
    onChange ={ () => setIncludeNumbers(!includeNumbers)}
    className = "h-4 w-4"
  />
  Include Numbers
</ label >


< label className = "flex flex-col text-left" >
  Password Length:
            < div className = "flex items-center gap-3" >
              < input
                type = "range"
                min ={ minLength}
    max ={ maxLength}
    value ={ passwordLength}
    onChange ={ (e) => setPasswordLength(parseInt(e.target.value))}
    className = "w-full accent-blue-500"
  />

  < p className = "font-semibold" >{ passwordLength}</ p >

</ div >

</ label >

</ div >

        < div className = "p-4 bg-gray-100 text-center rounded-xl text-lg select-all" >
          { password || "•••••••••••••"}
        </ div >

        {/* Buttons */}
        < div className = "flex gap-3 justify-center" >
          < button
            className = "px-5 py-3 rounded-xl text-white bg-blue-500 hover:bg-blue-600 transition"
            type = "submit"
          >
            Generate
          </ button >
          < button
            className = "px-5 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition"
            type = "button"
            onClick ={ copyPasswordToClipboard}
          >
            Copy Password
          </ button >
        </ div >

        < div
          ref= { successBox }
          className = "hidden bg-green-100 text-green-700 text-sm p-2 rounded-xl text-center"
        >
          Password Copied to Clipboard!
        </ div >
      </ form >
    </ div >
  );
    }

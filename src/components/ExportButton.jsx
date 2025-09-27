"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ExcelUpload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an Excel file!");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:5000/uploadexcel", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <div className="flex flex-row gap-2 items-center">
 <label htmlFor="file-upload" class='border-black border-1 px-2 py-1  w-30 rounded-md'>
  {file ? file.name : "Upload a file"}
</label>
<input
  id="file-upload"
  type="file"
  className="hidden"
  onChange={handleFileChange}
/>

  <Button
    // className="px-4 py-2 bg-indigo-600 text-white rounded"
    className="bg-indigo-600 text-white"
    onClick={handleUpload}
    variant={"outline"}
  >
    Upload Excel
  </Button>
</div>

  );
}
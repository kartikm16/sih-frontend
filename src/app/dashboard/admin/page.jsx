"use client"
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RiskBadge} from "@/components/RiskIndicator";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import * as Icons from "lucide-react";
import ExportButton from "@/components/ExportButton"


import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off, set, update, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyAqK_GGEUELDtQjh8Nw-ERDjoj3b1MTlA0",
  authDomain: "sih-tech810.firebaseapp.com",
  databaseURL: "https://sih-tech810-default-rtdb.firebaseio.com",
  projectId: "sih-tech810",
  storageBucket: "sih-tech810.firebasestorage.app",
  messagingSenderId: "271997109217",
  appId: "1:271997109217:web:022e233feaa668946308a0",
  measurementId: "G-JHJKQX3JXY"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);


const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];


export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mlStatus, setMlStatus] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);

  const [deptFilter, setDeptFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState({});

  useEffect(() => {
    const studentsRef = ref(db, 'students');
    const studentsListener = onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const studentsData = snapshot.val();
        const studentsArray = Object.keys(studentsData).map(key => ({
          id: key,
          ...studentsData[key]
        }));
        setStudents(studentsArray);
      } else {
        setStudents([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to students:", error);
      setLoading(false);
    });

    const facultyRef = ref(db, 'faculty');
    const facultyListener = onValue(facultyRef, (snapshot) => {
      if (snapshot.exists()) {
        const facultyData = snapshot.val();
        const facultyArray = Object.keys(facultyData).map(key => ({
          id: key,
          ...facultyData[key]
        }));
        setFaculty(facultyArray);
      } else {
        setFaculty([]);
      }
    });

    return () => {
      off(studentsRef, 'value', studentsListener);
      off(facultyRef, 'value', facultyListener);
    };
  }, []);

  const importExcelToFirebase = async (file) => {
    try {
      setImportLoading(true);
      
      const fileRef = storageRef(storage, `excel-imports/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      await getDownloadURL(fileRef);

      const text = await readFileAsText(file);
      const parsedData = parseCSV(text);
      
      await importStudentsToFirebase(parsedData);
      alert("Data imported successfully!");
      
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data: " + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    
    const [header, ...rows] = lines;
    const headers = header.split(",").map(h => h.trim().toLowerCase());
    
    return rows.map((line, index) => {
      const cols = line.split(",").map(c => c.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = cols[i]);
      
      return {
        student_id: obj.student_id || obj.id || `STU${String(index + 1).padStart(3, '0')}`,
        name: obj.name || obj.student_name || "Unknown Student",
        class: obj.class || obj.classname || obj.grade || "Unknown Class",
        attendance: parseInt(obj.attendance || obj.attendance_percentage || "0"),
        backlogs: parseInt(obj.backlogs || obj.backlog_count || "0"),
        exam_score: parseInt(obj.exam_score || obj.total_score || obj.marks || "0"),
        family_income: parseInt(obj.family_income || obj.income || "0"),
        fees_pending: parseInt(obj.fees_pending || obj.pending_fees || "0"),
        risk_status: obj.risk_status || "unknown",
        marks: {
          Maths: parseInt(obj.maths || obj.math || "0"),
          Physics: parseInt(obj.physics || "0"),
          Chemistry: parseInt(obj.chemistry || obj.chem || "0"),
          English: parseInt(obj.english || "0")
        },
        dept: obj.dept || obj.department || "General",
        className: obj.classname || obj.class || "Unknown Class",
        imported_at: new Date().toISOString()
      };
    });
  };

  const importStudentsToFirebase = async (studentsData) => {
    try {
      const updates = {};
      
      studentsData.forEach(student => {
        const studentId = student.student_id;
        updates[`students/${studentId}`] = {
          student_id: studentId,
          name: student.name,
          class: student.class,
          attendance: student.attendance || 0,
          backlogs: student.backlogs || 0,
          exam_score: student.exam_score || 0,
          family_income: student.family_income || 0,
          fees_pending: student.fees_pending || 0,
          risk_status: student.risk_status || "unknown",
          marks: student.marks || { Maths: 0, Physics: 0, Chemistry: 0, English: 0 },
          dept: student.dept || "General",
          className: student.className || student.class,
          imported_at: new Date().toISOString()
        };
      });

      await update(ref(db), updates);
      
    } catch (error) {
      console.error("Error importing students to Firebase:", error);
      throw error;
    }
  };

 const triggerMLModel = async () => {
  try {
    setMlLoading(true);
    setMlStatus("Running ML model...");

    // Prepare the data to send to your backend (make sure it matches your Firebase schema)
    const payload = students.map((student) => ({
      student_id: student.student_id,
      marks: student.marks, // send all marks here
      attendance: student.attendance,
      fees_pending: student.fees_pending,
      family_income: student.family_income,
      exam_score: student.exam_score, // example: if needed for prediction
      kt: student.kt, // example: if needed for prediction
    }));

    // Call your backend API
    // const response = await fetch("http://127.0.0.1:5000/predict", {
    //   method: "GET",
    // });
        const response = await fetch("https://d1da9e145882.ngrok-free.app/predict", {
      method: "GET",
    });

    if (!response.ok) throw new Error("Server error");

    // Assuming your backend returns predictions
    const predictions = await response.json(); // Prediction results from backend

    // Update your students with ML predictions
    await updateStudentsWithMLPredictions(predictions);

    setMlStatus("ML model completed successfully!");
  } catch (error) {
    // console.error("Error running ML model:", error);
    // setMlStatus("Error running ML model");
  } finally {
    setMlLoading(false);
    setTimeout(() => setMlStatus(""), 5000);
  }
};


  const updateStudentsWithMLPredictions = async (predictions) => {
    const updates = {};
    
    predictions.forEach(prediction => {
      updates[`students/${prediction.student_id}/risk_status`] = prediction.risk_level;
      updates[`students/${prediction.student_id}/ml_confidence`] = prediction.confidence;
      updates[`students/${prediction.student_id}/last_ml_update`] = new Date().toISOString();
    });

    await update(ref(db), updates);
  };

  const enriched = useMemo(() => students.map((s) => ({
    id: s.student_id || s.id,
    name: s.name,
    className: s.className || s.class,
    dept: s.dept || "General",
    attendance: s.attendance || 0,
    scores: s.marks || { Maths: 0, Physics: 0, Chemistry: 0, English: 0 },
    familyIncome: s.family_income,
    feesPending: s.fees_pending, //(s.fees_pending || 0) > 0,
    risk: s.risk_status,
    backlogs: s.kt || 0,
    exam_score: s.exam_score || 0,
    risk_status: s.risk_status || "unknown"
  })), [students]);

  const filtered = useMemo(() => enriched.filter((s) => {
    if (deptFilter !== "all" && s.dept !== deptFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(`${s.name}`.toLowerCase().includes(q) || 
            `${s.id}`.toLowerCase().includes(q) || 
            `${s.className}`.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [enriched, deptFilter, zoneFilter, query]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const totals = {
    students: enriched.length,
    faculty: faculty.length,
    green: enriched.filter(s => s.risk_status === "Low Risk").length,
    yellow: enriched.filter(s => s.risk_status === "Medium Risk").length,
    red: enriched.filter(s => s.risk_status === "High Risk").length,
  };

  const zoneData = [
    { name: "Green", value: totals.green, color: COLORS[0] },
    { name: "Yellow", value: totals.yellow, color: COLORS[1] },
    { name: "Red", value: totals.red, color: COLORS[2] },
  ];

 const deptData = Object.entries(
  enriched.reduce((acc, s) => {
    // Initialize department if not exists
    if (!acc[s.dept]) {
      acc[s.dept] = { green: 0, yellow: 0, red: 0 };
    }

    // Increment the proper risk category
    if (s.risk_status === "Low Risk") {
      acc[s.dept].green++;
    } else if (s.risk_status === "Medium Risk") {
      acc[s.dept].yellow++;
    } else if (s.risk_status === "High Risk") {
      acc[s.dept].red++;
    }

    return acc;
  }, {})
).map(([dept, counts]) => ({ dept, ...counts }));
  const trendData = [
    { sem: "S1", yellow: 12, red: 5 },
    { sem: "S2", yellow: 9, red: 6 },
    { sem: "S3", yellow: 10, red: 4 },
    { sem: "S4", yellow: 7, red: 3 },
  ];

  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const exportData = rows.map(student => ({
      student_id: student.id,
      name: student.name,
      class: student.className,
      attendance: student.attendance,
      backlogs: student.backlogs || 0,
      exam_score: student.exam_score || 0,
      family_income: student.familyIncome || 0,
      fees_pending: student.feesPending ? student.feesPending : 0,
      risk_status: student.risk_status || "unknown",
      Maths: student.scores.Maths || 0,
      Physics: student.scores.Physics || 0,
      Chemistry: student.scores.Chemistry || 0,
      English: student.scores.English || 0,
      dept: student.dept
    }));

    const csv = [Object.keys(exportData[0] || {}).join(",")]
      .concat(exportData.map(r => Object.values(r).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const glass = "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)]";

  return (
    <div className="relative mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 " />
      <div className="container mx-auto">
        <div className="flex gap-6">
          {/* <Sidebar
            items={[
              { label: "Dashboard Overview", to: "/admin" },
              { label: "Manage Students", to: "/admin#students" },
              { label: "Manage Faculty", to: "/admin#faculty" },
              { label: "Risk Analytics", to: "/admin#analytics" },
              { label: "Feedback Reports", to: "/admin#feedback" },
              { label: "Data Entry", to: "/admin#data" },
              { label: "Settings", to: "/admin#settings" },
            ]}
          /> */}

          <main className="flex-1 py-8 space-y-8">
            <header className={`rounded-xl p-6 ${glass} relative overflow-hidden`}>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-500/40 blur-2xl" />
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">Welcome, Admin</h1>
                  <p className="text-sm text-muted-foreground">University-wide control panel with analytics & data management.</p>
                  {mlStatus && (
                    <div className={`mt-2 text-sm font-medium ${
                      mlStatus.includes("Error") ? "text-red-600" : "text-green-600"
                    }`}>
                      {mlStatus}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 border border-red-200">
                    <Icons.AlertTriangle className="h-4 w-4" /> Red Zone: {totals.red}
                  </span>
                  
                  <input
                    type="file"
                    id="excel-import"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importExcelToFirebase(file);
                      e.target.value = '';
                    }}
                  />
                  <Button class="bg-transparent" variant="outline"><ExportButton  variant='outline'/></Button>
                  
                  {/* <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={() => document.getElementById('excel-import').click()}
                    disabled={importLoading || loading}
                  >
                    {importLoading ? <Icons.Loader className="h-4 w-4 animate-spin" /> : <Icons.Download className="h-4 w-4" />}
                    Import Excel
                  </Button> */}
                  
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    onClick={triggerMLModel}
                    disabled={mlLoading || loading || students.length === 0}
                  >
                    {mlLoading ? <Icons.Loader className="h-4 w-4 animate-spin" /> : <Icons.Brain className="h-4 w-4" />}
                    Run ML Analysis
                  </Button>
                  
                  <Button variant="outline" className="gap-2" onClick={() => exportCSV(enriched, "students_export.csv")}>
                    <Icons.Upload className="h-4 w-4" /> Export Data
                  </Button>
                </div>
              </div>
            </header>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Icons.Loader className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading data from Firebase...</span>
              </div>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-gradient-to-r from-blue-50 to-indigo-50 p-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="faculty">Faculty</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="data">Data Entry</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <section className="grid gap-6 md:grid-cols-4">
                    <StatCard title="Total Students" value={totals.students} icon={<Icons.Users className="h-5 w-5" />} border="from-blue-500" />
                    <StatCard title="Total Faculty" value={totals.faculty} icon={<Icons.UserCog className="h-5 w-5" />} border="from-indigo-500" />
                    <StatCard title="Yellow Zone" value={totals.yellow} icon={<Icons.AlertTriangle className="h-5 w-5 text-amber-500" />} border="from-amber-500" valueClass="text-amber-600" />
                    <StatCard title="Red Zone" value={totals.red} icon={<Icons.AlertTriangle className="h-5 w-5 text-red-500" />} border="from-red-500" valueClass="text-red-600" />

                    <Card className={`md:col-span-2 ${glass} hover:scale-[.995] transition-all`}>
                      <CardHeader>
                        <CardTitle>Risk Zones</CardTitle>
                        <CardDescription>Distribution across university</CardDescription>
                      </CardHeader>
                      <CardContent style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip />
                            <Pie data={zoneData} dataKey="value" nameKey="name" outerRadius={90} label>
                              {zoneData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className={`md:col-span-2 ${glass} hover:scale-[.995] transition-all`}>
                      <CardHeader>
                        <CardTitle>Department-wise Risk</CardTitle>
                        <CardDescription>Compare departments</CardDescription>
                      </CardHeader>
                      <CardContent style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={deptData}>
                            <XAxis dataKey="dept" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="green" stackId="a" fill="#22c55e" />
                            <Bar dataKey="yellow" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="red" stackId="a" fill="#ef4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className={`md:col-span-4 ${glass}`}>
                      <CardHeader>
                        <CardTitle>Trendline</CardTitle>
                        <CardDescription>Yellow/Red over semesters</CardDescription>
                      </CardHeader>
                      <CardContent style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <XAxis dataKey="sem" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="yellow" stroke="#f59e0b" strokeWidth={2} />
                            <Line type="monotone" dataKey="red" stroke="#ef4444" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </section>
                </TabsContent>

                <TabsContent value="students" className="space-y-4" id="students">
                  <Card className={`${glass}`}>
                    <CardHeader>
                      <CardTitle>Manage Students</CardTitle>
                      <CardDescription>Search, filter, import/export, edit</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="w-40">
                          <label className="text-xs text-muted-foreground">Department</label>
                          <Select value={deptFilter} onValueChange={setDeptFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              {[...new Set(students.map((s) => s.dept))].map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-40">
                          <label className="text-xs text-muted-foreground">Risk Zone</label>
                          <Select value={zoneFilter} onValueChange={setZoneFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-60">
                          <label className="text-xs text-muted-foreground">Search</label>
                          <Input placeholder="Name, ID or Class" value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>
                        <div className="ml-auto flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button><Icons.UserPlus className="h-4 w-4 mr-2" /> Add Student</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Student</DialogTitle>
                              </DialogHeader>
                              <AddEditStudent onSubmit={async (r) => {
                                await set(ref(db, `students/${r.id}`), {
                                  student_id: r.id,
                                  name: r.name,
                                  class: r.className,
                                  attendance: r.attendance,
                                  backlogs: 0,
                                  exam_score: Object.values(r.scores).reduce((a, b) => a + b, 0) / Object.values(r.scores).length,
                                  family_income: r.familyIncome || 0,
                                  fees_pending: r.feesPending ? 10000 : 0,
                                  marks: r.scores,
                                  dept: r.dept,
                                  className: r.className
                                });
                              }} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40">
                              <TableHead className="w-8"></TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Dept</TableHead>
                              <TableHead>Attendance</TableHead>
                              <TableHead>Backlogs</TableHead>
                              <TableHead>Fees</TableHead>
                              <TableHead>Income</TableHead>
                              <TableHead>Risk</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paged.map((s,index) => {
                              const isSelected = !!selected[s.id];
                              return (
                                <TableRow key={`${s.id}_${index}`} className="odd:bg-muted/20 hover:bg-muted/40 transition-colors">
                                  <TableCell><Checkbox checked={isSelected} onCheckedChange={(v) => setSelected(prev => ({ ...prev, [s.id]: Boolean(v) }))} /></TableCell>
                                  <TableCell className="font-mono">{s.id}</TableCell>
                                  <TableCell className="font-medium">{s.name}</TableCell>
                                  <TableCell>{s.className}</TableCell>
                                  <TableCell>{s.dept}</TableCell>
                                  <TableCell>{s.attendance}%</TableCell>
                                  <TableCell>{s.kt || 0}</TableCell>
                                  <TableCell>{s.feesPending ? `₹${s.feesPending}` : "Clear"}</TableCell>
                                  <TableCell>{s.familyIncome ? `₹${s.familyIncome}` : "—"}</TableCell>
                                  <TableCell><RiskBadge result={s.risk_status}/></TableCell>
                                  <TableCell className="text-right">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">Edit</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Student</DialogTitle>
                                        </DialogHeader>
                                        <AddEditStudent initial={s} onSubmit={async (r) => {
                                          await update(ref(db, `students/${s.id}`), {
                                            name: r.name,
                                            class: r.className,
                                            attendance: r.attendance,
                                            family_income: r.familyIncome || 0,
                                            fees_pending: r.feesPending ? 10000 : 0,
                                            marks: r.scores,
                                            dept: r.dept
                                          });
                                        }} />
                                      </DialogContent>
                                    </Dialog>
                                    <Button variant="destructive" className="ml-2" size="sm" onClick={async () => {
                                      await remove(ref(db, `students/${s.id}`));
                                    }}>Delete</Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="faculty" className="space-y-4" id="faculty">
                  <div className="flex items-center justify-between">
                    <CardTitle>Manage Faculty</CardTitle>
                    <Button variant="outline" onClick={() => exportCSV(faculty.map(f => ({ id: f.id, name: f.name, dept: f.dept, courses: f.courses.join("|") })), "faculty.csv")}><Icons.Download className="h-4 w-4 mr-2" /> Export</Button>
                  </div>
                  <div className={`overflow-x-auto rounded-lg border ${glass}`}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Dept</TableHead>
                          <TableHead>Courses</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {faculty.map((f) => (
                          <TableRow key={f.id} className="odd:bg-muted/20 hover:bg-muted/40 transition-colors">
                            <TableCell className="font-mono">{f.id}</TableCell>
                            <TableCell>{f.name}</TableCell>
                            <TableCell>{f.dept}</TableCell>
                            <TableCell>{f.courses?.join(", ") || "No courses"}</TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Faculty</DialogTitle>
                                  </DialogHeader>
                                  <AddEditFaculty initial={f} onSubmit={async (r) => {
                                    await update(ref(db, `faculty/${f.id}`), {
                                      name: r.name,
                                      dept: r.dept,
                                      courses: r.courses
                                    });
                                  }} />
                                </DialogContent>
                              </Dialog>
                              <Button variant="destructive" size="sm" className="ml-2" onClick={async () => {
                                await remove(ref(db, `faculty/${f.id}`));
                              }}>Delete</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4" id="analytics">
                  <div className="flex gap-3">
                    <div className="w-40">
                      <label className="text-xs text-muted-foreground">Department</label>
                      <Select value={deptFilter} onValueChange={setDeptFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {[...new Set(students.map((s) => s.dept))].map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-40">
                      <label className="text-xs text-muted-foreground">Risk Zone</label>
                      <Select value={zoneFilter} onValueChange={setZoneFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="yellow">Yellow</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Card className={`${glass}`}>
                    <CardHeader>
                      <CardTitle>Filtered Analytics</CardTitle>
                      <CardDescription>Click bars to drill down</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.values(filtered.reduce((acc, s) => { const k = s.dept; acc[k] = acc[k] || { dept: k, count: 0 }; acc[k].count++; return acc; }, {}))}>
                          <XAxis dataKey="dept" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4" id="feedback">
                  <div className="flex items-center justify-between">
                    <CardTitle>Feedback Reports</CardTitle>
                    <Button variant="outline" onClick={() => exportCSV([
                      { faculty: "Prof. Sharma", semester: "S3", rating: 4.5 },
                      { faculty: "Prof. Singh", semester: "S2", rating: 4.0 },
                    ], "feedback.csv")}><Icons.Download className="h-4 w-4 mr-2" /> Export</Button>
                  </div>
                  <Card className={`${glass}`}>
                    <CardHeader>
                      <CardTitle>Anonymous Feedback</CardTitle>
                      <CardDescription>Aggregated per faculty</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p>• Prof. Sharma (CSE): Avg 4.5/5 – common themes: "clear explanations", "helpful resources"</p>
                      <p>• Prof. Singh (ECE): Avg 4.0/5 – common themes: "needs pacing", "good practicals"</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data" className="grid gap-6 md:grid-cols-2" id="data">
                  <Card className={`${glass}`}>
                    <CardHeader>
                      <CardTitle>Family Income</CardTitle>
                      <CardDescription>Update per student</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <Input placeholder="Student ID" id="inc-id" />
                      <Input placeholder="Family Income (₹)" id="inc-val" type="number" />
                      <Button onClick={async () => {
                        const id = document.getElementById("inc-id").value;
                        const val = Number(document.getElementById("inc-val").value);
                        await update(ref(db, `students/${id}`), { family_income: val });
                      }}>Update Income</Button>
                    </CardContent>
                  </Card>
                  <Card className={`${glass}`}>
                    <CardHeader>
                      <CardTitle>Fees Pending</CardTitle>
                      <CardDescription>Update status</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <Input placeholder="Student ID" id="fee-id" />
                      <Select onValueChange={(v) => (document.getElementById("fee-val").value = v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Pending</SelectItem>
                          <SelectItem value="false">Clear</SelectItem>
                        </SelectContent>
                      </Select>
                      <input id="fee-val" type="hidden" />
                      <Button onClick={async () => {
                        const id = document.getElementById("fee-id").value;
                        const val = document.getElementById("fee-val").value === "true";
                        await update(ref(db, `students/${id}`), { fees_pending: val ? 10000 : 0 });
                      }}>Update Fees</Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" id="settings">
                  <Card className={`${glass}`}>
                    <CardHeader>
                      <CardTitle>Settings</CardTitle>
                      <CardDescription>General admin preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <label className="text-sm">Notification Email</label>
                      <Input placeholder="admin@university.edu" />
                      <label className="text-sm">Notes</label>
                      <Textarea rows={3} />
                      <div className="flex justify-end"><Button variant="outline">Save</Button></div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, border, valueClass, className }) {
  const glass = "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)]";
  return (
    <Card className={`${glass} relative overflow-hidden hover:scale-[.995] transition-transform ${className || ""}`}>
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${border} to-transparent opacity-30`} />
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className={`text-3xl ${valueClass || ""}`}>{value}</CardTitle>
        </div>
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 grid place-items-center">
          {icon}
        </div>
      </CardHeader>
    </Card>
  );
}

function AddEditStudent({ initial, onSubmit }) {
  const [id, setId] = useState(initial?.id || "");
  const [name, setName] = useState(initial?.name || "");
  const [className, setClassName] = useState(initial?.className || "");
  const [dept, setDept] = useState(initial?.dept || "");
  const [attendance, setAttendance] = useState(initial?.attendance || 0);
  const [familyIncome, setFamilyIncome] = useState(initial?.familyIncome);
  const [feesPending, setFeesPending] = useState(initial?.feesPending || false);
  const [maths, setMaths] = useState(initial?.scores?.Maths || 0);
  const [physics, setPhysics] = useState(initial?.scores?.Physics || 0);
  const [chemistry, setChemistry] = useState(initial?.scores?.Chemistry || 0);
  const [english, setEnglish] = useState(initial?.scores?.English || 0);

  return (
    <div className="grid gap-3">
      <Input placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} />
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Class" value={className} onChange={(e) => setClassName(e.target.value)} />
      <Input placeholder="Department" value={dept} onChange={(e) => setDept(e.target.value)} />
      <Input type="number" placeholder="Attendance %" value={attendance} onChange={(e) => setAttendance(Number(e.target.value))} />
      <Input type="number" placeholder="Family Income (₹)" value={familyIncome || 0} onChange={(e) => setFamilyIncome(Number(e.target.value))} />
      
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Maths Marks" value={maths} onChange={(e) => setMaths(Number(e.target.value))} />
        <Input type="number" placeholder="Physics Marks" value={physics} onChange={(e) => setPhysics(Number(e.target.value))} />
        <Input type="number" placeholder="Chemistry Marks" value={chemistry} onChange={(e) => setChemistry(Number(e.target.value))} />
        <Input type="number" placeholder="English Marks" value={english} onChange={(e) => setEnglish(Number(e.target.value))} />
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant={feesPending ? "destructive" : "secondary"} onClick={() => setFeesPending(v => !v)}>
          {feesPending ? "Fees Pending" : "Fees Clear"}
        </Button>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onSubmit({ 
          id, 
          name, 
          className, 
          dept, 
          attendance, 
          scores: { Maths: maths, Physics: physics, Chemistry: chemistry, English: english }, 
          familyIncome, 
          feesPending 
        })}>
          Save
        </Button>
      </div>
    </div>
  );
}

function AddEditFaculty({ initial, onSubmit }) {
  const [id, setId] = useState(initial?.id || "");
  const [name, setName] = useState(initial?.name || "");
  const [dept, setDept] = useState(initial?.dept || "");
  const [courses, setCourses] = useState(initial?.courses?.join(", ") || "");
  return (
    <div className="grid gap-3">
      <Input placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} />
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Department" value={dept} onChange={(e) => setDept(e.target.value)} />
      <Input placeholder="Courses (comma separated)" value={courses} onChange={(e) => setCourses(e.target.value)} />
      <div className="flex justify-end">
        <Button onClick={() => onSubmit({ id, name, dept, courses: courses.split(",").map(c => c.trim()).filter(Boolean) })}>Save</Button>
      </div>
    </div>
  );
}
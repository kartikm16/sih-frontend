"use client"
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskIndicator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as Icons from "lucide-react";
import {database} from "@/firebaseConfig"


import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

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

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function FacultyDashboard() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const studentsRef = ref(db, 'students');
    const listener = onValue(studentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const studentsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setStudents(studentsArray);
      } else {
        setStudents([]);
      }
    }, (error) => {
      console.error("Error fetching students from Firebase:", error);
    });
    return () => off(studentsRef, 'value', listener);
  }, []);

  const [riskFilter, setRiskFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleStudent, setScheduleStudent] = useState(undefined);
  const [scheduleDate, setScheduleDate] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefPush, setPrefPush] = useState(true);

  const enriched = useMemo(() => students.map((s) => ({
    id: s.student_id || s.id,
    name: s.name,
    className: s.className || s.class,
    dept: s.dept || "General",
    attendance: s.attendance || 0,
    scores: s.marks || s.scores || { Maths: 0, Physics: 0, Chemistry: 0, English: 0 },
    familyIncome: s.family_income,
    feesPending: (s.fees_pending || 0) > 0,
    risk:s.risk_status,
    backlogs: s.kt || 0,
    exam_score: s.exam_score || 0,
    risk_status: s.risk_status || "unknown"
  })), [students]);

  const filtered = useMemo(() => enriched.filter((s) => {
    if (riskFilter !== "all" && s.risk.zone !== riskFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(`${s.name}`.toLowerCase().includes(q) || `${s.studentId}`.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [enriched, riskFilter, query]);

  const counts = useMemo(() => ({
    total: students.length,
    green: enriched.filter((s) => s.risk_status === "Low Risk").length,
    yellow: enriched.filter((s) => s.risk_status === "Medium Risk").length,
    red: enriched.filter((s) => s.risk_status === "High Risk").length,
  }), [enriched, students.length]);

  const zoneData = [
    { name: "Green", value: counts.green, color: COLORS[0] },
    { name: "Yellow", value: counts.yellow, color: COLORS[1] },
    { name: "Red", value: counts.red, color: COLORS[2] },
  ];

  const subjects = Object.keys(enriched[0]?.scores ?? { Maths: 0, English: 0 });
  const redZone = useMemo(() => enriched.filter((s) => s.risk.zone === "red"), [enriched]);
  const yellowZone = useMemo(() => enriched.filter((s) => s.risk.zone === "yellow"), [enriched]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const [selected, setSelected] = useState({});
  const [mentorshipStudent, setMentorshipStudent] = useState(undefined);
  const [mentorshipDate, setMentorshipDate] = useState("");
  const [mentorshipSupport, setMentorshipSupport] = useState("");
  const [mentorshipObs, setMentorshipObs] = useState("");
  const [mentorshipNext, setMentorshipNext] = useState("");
  const [sessionHistory, setSessionHistory] = useState([]);
  const user = { name: "Professor Smith", role: "faculty" };

  function exportCSV(rows, filename) {
    const csv = [Object.keys(rows[0] || {}).join(",")]
      .concat(rows.map(r => Object.values(r).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const glass = "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)]";
  const setActiveTab = (tab) => { console.log(`Switching to tab: ${tab}`); };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,#93c5fd33,transparent_35%),radial-gradient(circle_at_80%_0%,#6366f133,transparent_35%),linear-gradient(120deg,#eef2ff,#eff6ff)]" />
      <div className="container mx-auto">
        <div className="flex gap-6">
          <main className="flex-1 py-8 space-y-8">
            <header className={`rounded-xl p-6 ${glass} relative overflow-hidden`}>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-500/40 blur-2xl" />
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome {user.name}. Streamlined tools for efficient mentoring.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 border border-red-200" onClick={() => setActiveTab("alerts")} aria-label="View critical alerts">
                    <Icons.AlertTriangle className="h-4 w-4" /> Critical Alerts: {counts.red}
                  </button>
                  <Button variant="outline" className="gap-2" onClick={() => exportCSV(students.map(s => ({ id: s.studentId, name: s.name, attendance: s.attendance })), "students.csv")}>
                    <Icons.Download className="h-4 w-4" /> Export
                  </Button>
                </div>
              </div>
            </header>

            {/* Tabs with all features */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-gradient-to-r from-blue-50 to-indigo-50 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="students">Student Management</TabsTrigger>
                <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
                <TabsTrigger value="mentorship">Mentorship Tools</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-6">
                <Card className={`${glass}`}>
                  <CardHeader>
                    <CardTitle>Risk Overview</CardTitle>
                    <CardDescription>Zone counters and distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                      <StatCard title="Green Zone" value={counts.green} icon={<Icons.CheckCircle className="h-5 w-5 text-emerald-600" />} border="from-emerald-500" valueClass="text-emerald-600" />
                      <StatCard title="Yellow Zone" value={counts.yellow} icon={<Icons.AlertTriangle className="h-5 w-5 text-amber-500" />} border="from-amber-500" valueClass="text-amber-600" />
                      <StatCard title="Red Zone" value={counts.red} icon={<Icons.AlertOctagon className="h-5 w-5 text-red-500" />} border="from-red-500" valueClass="text-red-600" />
                    </div>

                    <div className="grid gap-6 md:grid-cols-1">
                      <Card className={`${glass} hover:scale-[.995] transition-all`}>
                        <CardHeader>
                          <CardTitle>Risk Distribution</CardTitle>
                          <CardDescription>Class risk mix</CardDescription>
                        </CardHeader>
                        <CardContent style={{ height: 320 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip />
                              <Pie data={zoneData} dataKey="value" nameKey="name" outerRadius={120} label>
                                {zoneData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Student Management */}
              <TabsContent value="students" className="space-y-4" id="students">
                <Card className={`${glass}`}>
                  <CardHeader>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Search, filter, and bulk edit</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-48">
                        <label className="text-xs text-muted-foreground">Filter by Risk</label>
                        <Select value={riskFilter} onValueChange={(v) => { setPage(1); setRiskFilter(v); }}>
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
                        <Input placeholder="Search by name or ID" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="w-8"></TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Attendance %</TableHead>
                            <TableHead>Subject-wise Marks</TableHead>
                            <TableHead>Risk</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paged.map((s) => {
                            return (
                              <TableRow key={s.id} className="odd:bg-muted/20 hover:bg-muted/40 transition-colors">
                                <TableCell>
                                  <Checkbox checked={!!selected[s.id]} onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [s.id]: Boolean(v) }))} />
                                </TableCell>
                                <TableCell className="font-mono">{s.id}</TableCell>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.attendance}%</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    {subjects.map((subj) => (
                                      <span key={subj} className="text-xs text-muted-foreground w-16">{subj}: <span className="font-medium">{s.scores[subj] ?? 0}</span></span>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell><RiskBadge result={s.risk_status} /></TableCell>
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

              {/* Risk Alerts */}
              <TabsContent value="alerts" className="space-y-6" id="alerts">
                <Card className={`${glass}`}>
                  <CardHeader>
                    <CardTitle>Critical Alerts (Red Zone)</CardTitle>
                    <CardDescription>Immediate attention required</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {redZone.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No students in Red Zone.</div>
                    ) : (
                      redZone.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 bg-red-50">
                          <div>
                            <div className="font-medium">{s.name} · {s.id}</div>
                            <div className="text-xs text-muted-foreground">Reasons: {s.risk.reasons.join(", ") || "—"}</div>
                          </div>
                          <RiskBadge result={s.risk} />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className={`${glass}`}>
                  <CardHeader>
                    <CardTitle>Warnings (Yellow Zone)</CardTitle>
                    <CardDescription>Monitor and mentor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {yellowZone.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No students in Yellow Zone.</div>
                    ) : (
                      yellowZone.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 bg-amber-50">
                          <div>
                            <div className="font-medium">{s.name} · {s.id}</div>
                            <div className="text-xs text-muted-foreground">Reasons: {s.risk.reasons.join(", ") || "—"}</div>
                          </div>
                          <RiskBadge result={s.risk} />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mentorship Tools */}
              <TabsContent value="mentorship" className="space-y-6" id="mentorship">
                <Card className={`${glass}`}>
                  <CardHeader>
                    <CardTitle>Record Mentorship Session</CardTitle>
                    <CardDescription>Single-column form for clarity</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-xs text-muted-foreground">Select Student</label>
                        <Select value={mentorshipStudent} onValueChange={setMentorshipStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name} · {s.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs text-muted-foreground">Date</label>
                        <Input type="date" value={mentorshipDate} onChange={(e) => setMentorshipDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Support Provided</label>
                      <Input placeholder="e.g., study plan, resources" value={mentorshipSupport} onChange={(e) => setMentorshipSupport(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Observations & Notes</label>
                      <Textarea rows={4} value={mentorshipObs} onChange={(e) => setMentorshipObs(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Next Steps & Recommendations</label>
                      <Textarea rows={3} value={mentorshipNext} onChange={(e) => setMentorshipNext(e.target.value)} />
                    </div>

                    <div className="flex justify-center">
                      <Button onClick={() => {
                        if (!mentorshipStudent || !mentorshipDate) { toast({ title: "Please select student and date" }); return; }
                        const st = students.find(s => s.id === mentorshipStudent);
                        setSessionHistory((prev) => [{ id: st.id, name: st.name, date: mentorshipDate, note: mentorshipSupport || mentorshipObs || "Session recorded" }, ...prev]);
                        setMentorshipSupport(""); setMentorshipObs(""); setMentorshipNext("");
                        toast({ title: "Mentorship note submitted" });
                      }}>Submit</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${glass}`}>
                  <CardHeader>
                    <CardTitle>Session History</CardTitle>
                    <CardDescription>Recent mentorship sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {sessionHistory.length === 0 ? (
                      <p className="text-muted-foreground">No sessions recorded yet.</p>
                    ) : (
                      sessionHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border bg-white/60 dark:bg-white/5 p-3">
                          <div>
                            <div className="font-medium">{h.name} · {h.id}</div>
                            <div className="text-xs text-muted-foreground">{h.date} — {h.note}</div>
                          </div>
                          <Button variant="outline" size="sm">Share with Admin</Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}

// Reusable components
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
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 grid place-items-center">{icon}</div>
      </CardHeader>
    </Card>
  );
}

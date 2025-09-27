"use client";
import { useEffect, useMemo, useState } from "react";
import { ref, get, child } from "firebase/database";
import { database } from "@/firebaseConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/RiskIndicator";

export default function StudentDashboard() {
  const [user, setUser] = useState(null); // Student data from Firebase
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(database);
    const studentId = "0"; // Replace with dynamic ID if needed

    get(child(dbRef, `students/${studentId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setUser(snapshot.val());
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  // ✅ Always call hooks, even if user is null
  const risk = useMemo(() => {
    if (!user) return null;
    return "Low Risk"
  }, [user]);

  // Now safe to return conditionally
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No student data found</p>;


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Student information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {user.name}</div>
            <div><span className="text-muted-foreground">Class:</span> {user.class}</div>
            <div><span className="text-muted-foreground">Student ID:</span> {user.student_id}</div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-muted-foreground">Risk:</span>
              <RiskBadge result={risk} />
            </div>
          </CardContent>
        </Card>

        {/* Academic Status Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Academic Status</CardTitle>
            <CardDescription>Attendance & marks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Attendance</span>
              <span className="font-medium">{user.attendance}%</span>
            </div>
            <Progress value={user.attendance} />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Marks</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(user.marks).map((s) => {
                    const m = user.marks[s];
                    return (
                      <tr key={s} className="border-t">
                        <td className="py-2 pr-4 font-medium">{s}</td>
                        <td className="py-2 pr-4">{m}</td>
                        <td className="py-2 pr-4">
                          {m < 40 ? (
                            <span className="text-red-600">Backlog</span>
                          ) : (
                            <span className="text-emerald-600">Pass</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

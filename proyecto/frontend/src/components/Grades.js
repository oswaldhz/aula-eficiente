import { useState, useEffect } from "react";
import { fetchData, postData } from "../api";

export default function Grades() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [form, setForm] = useState({ score: "", student_id: "", activity_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ score: "", student_id: "", activity_id: "" });

  useEffect(() => {
    fetchData("grades").then(setGrades);
    fetchData("students").then(setStudents);
    fetchData("activities").then(setActivities);
  }, []);

  // -------------------- MANEJO DE FORM (CREAR) --------------------
  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Filtrar actividades al seleccionar estudiante (para el formulario de creación)
    if (name === "student_id") {
      const student = students.find(s => s.id.toString() === value);
      if (student) {
        const filtered = activities.filter(a => a.classroom_id === student.classroom_id);
        setFilteredActivities(filtered);
        setForm(prev => ({ ...prev, activity_id: "" })); // reset de actividad seleccionada
      } else {
        setFilteredActivities([]);
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.activity_id) {
      alert("No hay actividades disponibles para este estudiante");
      return;
    }
    const newGrade = await postData("grades", form);
    if (newGrade) {
      setGrades(prev => [...prev, { id: newGrade.id, ...form }]);
      setForm({ score: "", student_id: "", activity_id: "" });
      setFilteredActivities([]);
    }
  };

  // -------------------- CRUD (EDITAR/ELIMINAR) --------------------
  const updateGrade = async (id, updatedData) => {
    const res = await fetch(`http://127.0.0.1:5000/grades/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });

    if (res.ok) {
      const data = await res.json();
      setGrades(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
      setEditingId(null);
      setEditForm({ score: "", student_id: "", activity_id: "" });
    } else {
      console.error("Error al actualizar grade");
    }
  };

  const deleteGrade = async (id) => {
    const res = await fetch(`http://127.0.0.1:5000/grades/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      setGrades(prev => prev.filter(g => g.id !== id));
    } else {
      console.error("Error al eliminar grade");
    }
  };

  return (
    <div>
      <h2>Grades</h2>

      {/* Formulario de creación */}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          name="score"
          placeholder="Score"
          value={form.score}
          onChange={handleChange}
          required
        />

        <select
          name="student_id"
          value={form.student_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          name="activity_id"
          value={form.activity_id}
          onChange={handleChange}
          required
          disabled={filteredActivities.length === 0}
        >
          <option value="">Select Activity</option>
          {filteredActivities.map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>

        <button type="submit">Add Grade</button>
      </form>

      {/* Lista + edición inline */}
      <ul>
        {grades.map(g => {
          const student = students.find(s => s.id === g.student_id);
          const activity = activities.find(a => a.id === g.activity_id);

          return (
            <li key={g.id}>
              {editingId === g.id ? (
                <>
                  <input
                    type="number"
                    value={editForm.score}
                    onChange={e => setEditForm({ ...editForm, score: e.target.value })}
                  />

                  <select
                    value={editForm.student_id}
                    onChange={e => {
                      const newStudentId = e.target.value;
                      setEditForm({ ...editForm, student_id: newStudentId, activity_id: "" });

                      // Filtrado de actividades para el modo edición
                      const st = students.find(s => s.id.toString() === newStudentId);
                      setFilteredActivities(st ? activities.filter(a => a.classroom_id === st.classroom_id) : []);
                    }}
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <select
                    value={editForm.activity_id}
                    onChange={e => setEditForm({ ...editForm, activity_id: e.target.value })}
                    disabled={filteredActivities.length === 0}
                  >
                    {filteredActivities.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>

                  <button onClick={() => updateGrade(g.id, editForm)}>Save</button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({ score: "", student_id: "", activity_id: "" });
                      setFilteredActivities([]);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  Score: {g.score} — Student: {student ? student.name : g.student_id} — Activity: {activity ? activity.title : g.activity_id}
                  <button
                    onClick={() => {
                      setEditingId(g.id);
                      setEditForm({ score: g.score, student_id: g.student_id, activity_id: g.activity_id });
                      // Pre-cargar el filtro para el estudiante actual en edición
                      const st = students.find(s => s.id === g.student_id);
                      setFilteredActivities(st ? activities.filter(a => a.classroom_id === st.classroom_id) : []);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteGrade(g.id)}>Delete</button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

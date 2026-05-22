import React, { useEffect, useState } from "react";
import { useFetch } from "../api";
import {
  Box, Heading, Text, Select, Input, HStack, Center, Spinner, Table, Thead, Tbody, Tr, Th, Td,
  Button, useToast, useColorModeValue, Icon, Flex, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FileText, Download } from "lucide-react";

const MotionBox = motion(Box);

export default function ReportsPage() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { fetchData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [g, s, a, c] = await Promise.all([fetchData("grades"), fetchData("students"), fetchData("activities"), fetchData("classrooms")]);
    setGrades(g); setStudents(s); setActivities(a); setClassrooms(c);
    setLoading(false);
  };

  const filteredActivities = selectedClassroom ? activities.filter(a => a?.classroom_id?.toString() === selectedClassroom) : [];

  const filteredGrades = selectedClassroom ? grades.filter(g => {
    const student = students.find(s => s?.id?.toString() === g.student_id?.toString());
    const activity = activities.find(a => a?.id?.toString() === g.activity_id?.toString());
    if (!student || !activity) return false;
    const matchesActivity = !selectedActivity || activity.id.toString() === selectedActivity;
    const matchesStudent = !studentSearch || student.name.toLowerCase().includes(studentSearch.toLowerCase()) || student.identifier.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesActivity && matchesStudent;
  }).sort((a,b) => {
    const nameA = students.find(s => s?.id?.toString() === a.student_id?.toString())?.name || "";
    const nameB = students.find(s => s?.id?.toString() === b.student_id?.toString())?.name || "";
    return nameA.localeCompare(nameB);
  }) : [];

  const exportToPDF = () => {
    if (!selectedClassroom) return;
    const doc = new jsPDF();
    doc.text("Reporte de Notas", 14, 20);
    const columns = ["Estudiante", "Identificador", "Actividad", "Nota", "Max", "Aula"];
    const rows = filteredGrades.map(g => {
      const s = students.find(s => s.id.toString() === g.student_id.toString()) || {};
      const a = activities.find(a => a.id.toString() === g.activity_id.toString()) || {};
      const c = classrooms.find(c => c.id.toString() === s.classroom_id?.toString()) || {};
      return [s.name, s.identifier, a.title, g.score, a.max_score, c.name];
    });
    autoTable(doc, { head: [columns], body: rows, startY: 30 });
    doc.save("reporte_notas.pdf");
  };

  const exportToExcel = () => {
    if (!selectedClassroom) return;
    const data = filteredGrades.map(g => {
      const s = students.find(s => s.id.toString() === g.student_id.toString()) || {};
      const a = activities.find(a => a.id.toString() === g.activity_id.toString()) || {};
      const c = classrooms.find(c => c.id.toString() === s.classroom_id?.toString()) || {};
      return { Estudiante: s.name, Identificador: s.identifier, Actividad: a.title, Nota: g.score, "Nota Máxima": a.max_score, Aula: c.name };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "reporte_notas.xlsx");
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="neutral.800">Reportes</Heading>
            <Text color="neutral.500">Genera reportes de calificaciones</Text>
          </Box>
        </Flex>
      </MotionBox>

      <HStack mb={6} spacing={4} flexWrap="wrap">
        <Select placeholder="Filtrar por aula" maxW="200px" value={selectedClassroom} onChange={(e) => { setSelectedClassroom(e.target.value); setSelectedActivity(""); }} bg={cardBg}>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        {selectedClassroom && (
          <Select placeholder="Filtrar por actividad" maxW="200px" value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} bg={cardBg}>
            {filteredActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
        )}
        <Input placeholder="Buscar estudiante" maxW="250px" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} bg={cardBg} />
        <Button leftIcon={<Download />} colorScheme="red" onClick={exportToPDF}>PDF</Button>
        <Button leftIcon={<Download />} colorScheme="green" onClick={exportToExcel}>Excel</Button>
      </HStack>

      {loading ? (
        <Box bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor} p={4}>
          <Skeleton height="400px" />
        </Box>
      ) : !selectedClassroom ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={FileText} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">Selecciona un aula</Text>
            <Text color="neutral.500">Elige un aula para generar reportes</Text>
          </Center>
        </MotionBox>
      ) : filteredGrades.length === 0 ? (
        <Center py={16} bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
          <Text color="neutral.500">No hay registros para mostrar</Text>
        </Center>
      ) : (
        <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <Box overflowX="auto" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Table variant="simple">
              <Thead><Tr><Th>Estudiante</Th><Th>ID</Th><Th>Actividad</Th><Th>Nota</Th><Th>Max</Th><Th>Aula</Th></Tr></Thead>
              <Tbody>
                {filteredGrades.map((g,i) => {
                  const s = students.find(s => s.id.toString() === g.student_id.toString()) || {};
                  const a = activities.find(a => a.id.toString() === g.activity_id.toString()) || {};
                  const c = classrooms.find(c => c.id.toString() === s.classroom_id?.toString()) || {};
                  return (<Tr key={i}><Td>{s.name}</Td><Td>{s.identifier}</Td><Td>{a.title}</Td><Td>{g.score}</Td><Td>{a.max_score}</Td><Td>{c.name}</Td></Tr>);
                })}
              </Tbody>
            </Table>
          </Box>
        </MotionBox>
      )}
    </Box>
  );
}
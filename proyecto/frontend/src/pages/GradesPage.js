import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box, Button, Flex, Heading, Text, Input, Select, Spinner, Center, VStack, HStack, Badge,
  useToast, Tooltip, useColorModeValue, Icon, SimpleGrid, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { GraduationCap, Save } from "lucide-react";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

export default function GradesPage({ selectedPeriodo }) {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [scores, setScores] = useState({});
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { fetchData, postData, putData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  useEffect(() => { loadData(); setSelectedClassroom(""); setSelectedActivity(""); }, [selectedPeriodo]);

  const loadData = async () => {
    setIsLoading(true);
    const periodo = selectedPeriodo || localStorage.getItem("periodo") || "";
    const [classroomsData, gradesData, studentsData, activitiesData] = await Promise.all([
      fetchData(`classrooms?period_id=${periodo}`),
      fetchData(`grades?period_id=${periodo}`),
      fetchData("students"),
      fetchData("activities"),
    ]);
    setClassrooms(classroomsData);
    setGrades(gradesData);
    setStudents(studentsData);
    setActivities(activitiesData);
    setIsLoading(false);
  };

  const getMaxScore = (activityId) => {
    const activity = activities.find(a => String(a.id) === String(activityId));
    return activity ? parseFloat(activity.max_score) : null;
  };

  const getActivityTitle = (activityId) => activities.find(a => String(a.id) === String(activityId))?.title || "N/A";

  const getStudentGrade = (studentId, activityId) => grades.find(g => String(g.student_id) === String(studentId) && String(g.activity_id) === String(activityId));

  const filteredStudents = students
    .filter(s => selectedClassroom ? String(s.classroom_id) === String(selectedClassroom) : true)
    .filter(s => studentSearch ? s.name.toLowerCase().includes(studentSearch.toLowerCase()) : true)
    .sort((a,b) => a.name.localeCompare(b.name));

  const filteredActivities = selectedClassroom ? activities.filter(a => String(a.classroom_id) === String(selectedClassroom)) : [];

  const handleScoreChange = (studentId, value) => {
    const maxScore = getMaxScore(selectedActivity);
    if (maxScore !== null && value !== "" && parseFloat(value) > maxScore) {
      toast({ title: `Máximo ${maxScore}`, status: "warning", duration: 1500 });
      return;
    }
    setScores({ ...scores, [studentId]: value });
  };

  const handleSaveScore = async (studentId) => {
    if (!selectedActivity || scores[studentId] === undefined || scores[studentId] === "") return;
    const existing = getStudentGrade(studentId, selectedActivity);
    try {
      if (existing) {
        await putData(`grades/${existing.id}`, { score: parseFloat(scores[studentId]) });
        setGrades(prev => prev.map(g => g.id === existing.id ? { ...g, score: parseFloat(scores[studentId]) } : g));
      } else {
        const newGrade = { student_id: studentId, activity_id: selectedActivity, score: parseFloat(scores[studentId]) };
        const saved = await postData("grades/", newGrade);
        if (saved) setGrades(prev => [...prev, saved]);
      }
      toast({ title: "Nota guardada", status: "success", duration: 2000 });
      setEditingStudentId(null);
      setScores(prev => ({ ...prev, [studentId]: "" }));
    } catch (err) {
      toast({ title: "Error", status: "error" });
    }
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="neutral.800">Calificaciones</Heading>
            <Text color="neutral.500">Evalúa a tus estudiantes por actividad</Text>
          </Box>
        </Flex>
      </MotionBox>

      <HStack mb={6} spacing={4} flexWrap="wrap">
        <Select placeholder="Seleccionar aula" maxW="250px" value={selectedClassroom} onChange={(e) => { setSelectedClassroom(e.target.value); setSelectedActivity(""); }} bg={cardBg}>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        {selectedClassroom && (
          <Select placeholder="Seleccionar actividad" maxW="250px" value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} bg={cardBg}>
            {filteredActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
        )}
        {selectedClassroom && (
          <Input placeholder="Buscar estudiante" maxW="250px" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} bg={cardBg} />
        )}
      </HStack>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="100px" rounded="xl" />
          ))}
        </SimpleGrid>
      ) : !selectedClassroom || !selectedActivity ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={GraduationCap} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">Selecciona aula y actividad</Text>
            <Text color="neutral.500">Elige un aula y una actividad para comenzar a calificar</Text>
          </Center>
        </MotionBox>
      ) : filteredStudents.length === 0 ? (
        <Center py={16} bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
          <Text color="neutral.500">No hay estudiantes en esta aula</Text>
        </Center>
      ) : (
        <MotionSimpleGrid columns={{ base: 1, md: 2 }} spacing={4} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible">
          {filteredStudents.map((student, idx) => {
            const grade = getStudentGrade(student.id, selectedActivity);
            const isEditing = editingStudentId === student.id;
            const maxScore = getMaxScore(selectedActivity);
            return (
              <MotionBox key={student.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Box bg={cardBg} p={5} shadow="sm" rounded="2xl" borderWidth="1px" borderColor={borderColor} _hover={{ shadow: "md" }}>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="semibold" color="neutral.800">{student.name}</Text>
                      <HStack mt={1}>
                        <Badge colorScheme="brand" variant="subtle">{getActivityTitle(selectedActivity)}</Badge>
                        <Badge colorScheme="green" variant="subtle">Max: {maxScore}</Badge>
                      </HStack>
                    </Box>
                    {grade && !isEditing ? (
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg" color="brand.600">{grade.score}</Text>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingStudentId(student.id); setScores({ ...scores, [student.id]: grade.score }); }}>Editar</Button>
                      </HStack>
                    ) : (
                      <HStack>
                        <Tooltip label={`Máximo ${maxScore}`}>
                          <Input size="sm" type="number" width="100px" value={scores[student.id] || ""} onChange={(e) => handleScoreChange(student.id, e.target.value)} />
                        </Tooltip>
                        <Button size="sm" leftIcon={<Save size={16} />} colorScheme="brand" onClick={() => handleSaveScore(student.id)}>Guardar</Button>
                      </HStack>
                    )}
                  </Flex>
                </Box>
              </MotionBox>
            );
          })}
        </MotionSimpleGrid>
      )}
    </Box>
  );
}
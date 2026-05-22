import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box, Button, Flex, Heading, Text, Input, Select, Spinner, Center, SimpleGrid,
  VStack, HStack, Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, useColorModeValue,
  Icon, IconButton, Menu, MenuButton, MenuList, MenuItem, InputGroup, InputLeftElement,
  useToast, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Plus, Users, MoreVertical, Edit, Trash2, Search } from "lucide-react";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({ name: "", identifier: "", classroom_id: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { fetchData, postData, putData, deleteData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [studentsData, classroomsData] = await Promise.all([fetchData("students"), fetchData("classrooms")]);
    setStudents(studentsData);
    setClassrooms(classroomsData);
    setIsLoading(false);
  };

  const filteredStudents = students
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.identifier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClassroom = selectedClassroom ? String(s.classroom_id) === String(selectedClassroom) : true;
      return matchesSearch && matchesClassroom;
    })
    .sort((a,b) => a.name.localeCompare(b.name));

  const handleSubmit = async () => {
    if (!formData.name || !formData.identifier || !formData.classroom_id) {
      toast({ title: "Campos incompletos", status: "warning", duration: 2000 });
      return;
    }
    if (editingStudent) {
      await putData(`students/${editingStudent.id}/`, formData);
    } else {
      await postData("students/", formData);
    }
    loadData();
    onClose();
    resetForm();
    toast({ title: editingStudent ? "Estudiante actualizado" : "Estudiante creado", status: "success" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este estudiante?")) {
      await deleteData(`students/${id}/`);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", identifier: "", classroom_id: "" });
    setEditingStudent(null);
  };

  const getClassroomName = (id) => classrooms.find(c => c.id === id)?.name || "N/A";

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="neutral.800">Estudiantes</Heading>
            <Text color="neutral.500">Gestiona tus estudiantes y asígnalos a aulas</Text>
          </Box>
          <Button leftIcon={<Plus />} colorScheme="brand" onClick={() => { resetForm(); onOpen(); }}>
            Nuevo Estudiante
          </Button>
        </Flex>
      </MotionBox>

      <HStack mb={6} spacing={4}>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none"><Search color="var(--chakra-colors-neutral-400)" /></InputLeftElement>
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg={cardBg} />
        </InputGroup>
        <Select placeholder="Todas las aulas" maxW="250px" value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} bg={cardBg}>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </HStack>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} bg={cardBg} rounded="2xl" p={5} borderWidth="1px" borderColor={borderColor}>
              <Skeleton height="24px" width="60%" mb={3} />
              <Skeleton height="20px" width="40%" mb={4} />
              <Skeleton height="16px" width="70%" />
            </Box>
          ))}
        </SimpleGrid>
      ) : filteredStudents.length === 0 ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={Users} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">No hay estudiantes</Text>
            <Text color="neutral.500" mb={6}>Agrega tu primer estudiante</Text>
            <Button leftIcon={<Plus />} colorScheme="brand" onClick={onOpen} size="lg">Crear Estudiante</Button>
          </Center>
        </MotionBox>
      ) : (
        <MotionSimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacing={6}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredStudents.map((student) => (
            <MotionBox key={student.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Box
                bg={cardBg}
                shadow="sm"
                rounded="2xl"
                p={5}
                borderWidth="1px"
                borderColor={borderColor}
                _hover={{ shadow: "xl", borderColor: "brand.200" }}
                transition="all 0.3s"
              >
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={1}>
                    <Heading size="md" color="neutral.800">{student.name}</Heading>
                    <Badge colorScheme="brand" variant="subtle">{student.identifier}</Badge>
                    <Text fontSize="sm" color="neutral.500">Aula: {getClassroomName(student.classroom_id)}</Text>
                  </VStack>
                  <Menu>
                    <MenuButton as={IconButton} icon={<MoreVertical />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<Edit size={16} />} onClick={() => { setEditingStudent(student); setFormData({ name: student.name, identifier: student.identifier, classroom_id: student.classroom_id }); onOpen(); }}>
                        Editar
                      </MenuItem>
                      <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDelete(student.id)}>
                        Eliminar
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Box>
            </MotionBox>
          ))}
        </MotionSimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent rounded="2xl">
          <ModalHeader>{editingStudent ? "Editar Estudiante" : "Nuevo Estudiante"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired><FormLabel>Nombre</FormLabel><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></FormControl>
              <FormControl isRequired><FormLabel>Identificador</FormLabel><Input value={formData.identifier} onChange={(e) => setFormData({...formData, identifier: e.target.value})} /></FormControl>
              <FormControl isRequired><FormLabel>Aula</FormLabel><Select value={formData.classroom_id} onChange={(e) => setFormData({...formData, classroom_id: e.target.value})} placeholder="Seleccionar aula">
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="brand" onClick={handleSubmit}>{editingStudent ? "Actualizar" : "Crear"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
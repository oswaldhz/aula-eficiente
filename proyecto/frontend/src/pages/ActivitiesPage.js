import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box, Button, Flex, Heading, Text, Input, Select, Spinner, Center, SimpleGrid,
  VStack, HStack, Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Textarea,
  useColorModeValue, Icon, IconButton, Menu, MenuButton, MenuList, MenuItem,
  useToast, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Plus, ClipboardList, MoreVertical, Edit, Trash2 } from "lucide-react";

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

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { fetchData, postData, putData, deleteData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [activitiesData, classroomsData] = await Promise.all([fetchData("activities"), fetchData("classrooms")]);
    setActivities(activitiesData);
    setClassrooms(classroomsData);
    setIsLoading(false);
  };

  const filteredActivities = selectedClassroom
    ? activities.filter(a => a.classroom_id != null && String(a.classroom_id) === String(selectedClassroom))
    : [];

  const getClassroomName = (id) => classrooms.find(c => c.id === id)?.name || "N/A";

  const handleSubmit = async () => {
    if (!formData.title || !formData.due_date || !formData.max_score || !formData.classroom_id) {
      toast({ title: "Campos incompletos", status: "warning" });
      return;
    }
    if (editingActivity) {
      await putData(`activities/${editingActivity.id}/`, formData);
    } else {
      await postData("activities/", formData);
    }
    loadData();
    onClose();
    resetForm();
    toast({ title: editingActivity ? "Actividad actualizada" : "Actividad creada", status: "success" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar esta actividad?")) {
      await deleteData(`activities/${id}/`);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
    setEditingActivity(null);
  };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="neutral.800">Actividades</Heading>
            <Text color="neutral.500">Gestiona las actividades por aula</Text>
          </Box>
          <Button leftIcon={<Plus />} colorScheme="brand" onClick={() => { resetForm(); onOpen(); }}>
            Nueva Actividad
          </Button>
        </Flex>
      </MotionBox>

      <HStack mb={6} spacing={4}>
        <Select placeholder="Filtrar por aula" maxW="300px" value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} bg={cardBg}>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </HStack>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} bg={cardBg} rounded="2xl" p={5} borderWidth="1px" borderColor={borderColor}>
              <Skeleton height="24px" width="60%" mb={3} />
              <Skeleton height="16px" width="80%" mb={4} />
              <Skeleton height="20px" width="40%" />
            </Box>
          ))}
        </SimpleGrid>
      ) : !selectedClassroom ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={ClipboardList} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">Selecciona un aula</Text>
            <Text color="neutral.500">Elige un aula para ver sus actividades</Text>
          </Center>
        </MotionBox>
      ) : filteredActivities.length === 0 ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={ClipboardList} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">No hay actividades</Text>
            <Text color="neutral.500" mb={6}>Crea tu primera actividad para esta aula</Text>
            <Button leftIcon={<Plus />} colorScheme="brand" onClick={onOpen} size="lg">Crear Actividad</Button>
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
          {filteredActivities.map((activity) => (
            <MotionBox key={activity.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
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
                    <Heading size="md" color="neutral.800">{activity.title}</Heading>
                    <Text fontSize="sm" color="neutral.500">{activity.description || "Sin descripción"}</Text>
                    <HStack mt={2}>
                      <Badge colorScheme="green" variant="subtle">Max: {activity.max_score}</Badge>
                      <Badge colorScheme="purple" variant="subtle">Entrega: {activity.due_date ? new Date(activity.due_date).toLocaleDateString() : "N/A"}</Badge>
                    </HStack>
                    <Text fontSize="xs" color="neutral.400">Aula: {getClassroomName(activity.classroom_id)}</Text>
                  </VStack>
                  <Menu>
                    <MenuButton as={IconButton} icon={<MoreVertical />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<Edit size={16} />} onClick={() => { setEditingActivity(activity); setFormData({ title: activity.title, description: activity.description, due_date: activity.due_date, max_score: activity.max_score, classroom_id: activity.classroom_id }); onOpen(); }}>
                        Editar
                      </MenuItem>
                      <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDelete(activity.id)}>
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

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent rounded="2xl">
          <ModalHeader>{editingActivity ? "Editar Actividad" : "Nueva Actividad"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired><FormLabel>Título</FormLabel><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></FormControl>
              <FormControl><FormLabel>Descripción</FormLabel><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></FormControl>
              <FormControl isRequired><FormLabel>Fecha de entrega</FormLabel><Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} /></FormControl>
              <FormControl isRequired><FormLabel>Puntaje máximo</FormLabel><Input type="number" value={formData.max_score} onChange={(e) => setFormData({...formData, max_score: e.target.value})} /></FormControl>
              <FormControl isRequired><FormLabel>Aula</FormLabel><Select value={formData.classroom_id} onChange={(e) => setFormData({...formData, classroom_id: e.target.value})} placeholder="Seleccionar aula">
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="brand" onClick={handleSubmit}>{editingActivity ? "Actualizar" : "Crear"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
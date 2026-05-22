// src/pages/TeachersPage.js
import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Input,
  Spinner,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Plus, Edit, DeleteIcon, SearchIcon, Users } from "lucide-react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { fetchData, postData, putData, deleteData } = useFetch();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const teachersData = await fetchData("teachers");
      setTeachers(teachersData);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) return;

    try {
      if (editingTeacher) {
        await putData(`teachers/${editingTeacher.id}`, formData);
      } else {
        await postData("teachers/", formData);
      }
      loadData();
      setFormData({ name: "", email: "" });
      setEditingTeacher(null);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({ name: teacher.name, email: teacher.email });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar este profesor?")) return;
    try {
      await deleteData(`teachers/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading>Administración de Profesores</Heading>
          <Text color="gray.500">Gestiona los profesores</Text>
        </Box>
        <Button leftIcon={<Plus />} colorScheme="green" onClick={onOpen}>
          Nuevo Profesor
        </Button>
      </Flex>

      {/* Stats */}
      <Grid templateColumns={{ base: "1fr", md: "1fr" }} gap={6} mb={6}>
        <Box p={4} bg="white" shadow="md" rounded="lg">
          <Flex align="center" gap={3}>
            <Box bg="green.100" p={2} rounded="md">
              <Users color="#059669" size={24} />
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.500">Total Profesores</Text>
              <Text fontSize="2xl" fontWeight="bold">{teachers.length}</Text>
            </Box>
          </Flex>
        </Box>
      </Grid>

      {/* Search */}
      <HStack mb={6} spacing={3}>
        <Input
          placeholder="Buscar por nombre o email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
          variant="filled"
          leftElement={<SearchIcon />}
        />
      </HStack>

      {/* Teachers List */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
        {isLoading ? (
          <Center p={10}><Spinner size="xl" /></Center>
        ) : filteredTeachers.length > 0 ? (
          filteredTeachers.map((t) => (
            <Box
              key={t.id}
              p={4}
              bg="white"
              shadow="md"
              rounded="lg"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              _hover={{ bg: "gray.50" }}
            >
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">{t.name}</Text>
                <Badge colorScheme="blue">{t.email}</Badge>
              </VStack>
              <HStack spacing={2}>
                <Button size="sm" variant="outline" onClick={() => handleEdit(t)}>
                  <Edit size={16} />
                </Button>
                <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDelete(t.id)}>
                  <DeleteIcon />
                </Button>
              </HStack>
            </Box>
          ))
        ) : (
          <Center py={10} flexDirection="column">
            <Users size={48} color="#CBD5E0" />
            <Text mt={4} fontSize="lg" color="gray.600">No se encontraron profesores</Text>
          </Center>
        )}
      </Grid>

      {/* Modal Create/Edit */}
      <Modal isOpen={isOpen} onClose={() => { onClose(); setEditingTeacher(null); setFormData({ name: "", email: "" }); }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingTeacher ? "Editar Profesor" : "Nuevo Profesor"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input placeholder="Nombre completo" name="name" value={formData.name} onChange={handleChange} />
              <Input placeholder="Email" name="email" value={formData.email} onChange={handleChange} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={handleSubmit}>
              {editingTeacher ? "Actualizar" : "Registrar"}
            </Button>
            <Button variant="ghost" onClick={() => { onClose(); setEditingTeacher(null); }}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

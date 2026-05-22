import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box, Button, Flex, Heading, Input, VStack, Spinner, Center, SimpleGrid,
  Text, Icon, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Textarea,
  useColorModeValue, Badge, HStack, IconButton, Menu, MenuButton, MenuList, MenuItem,
  InputGroup, InputLeftElement, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Plus, BookOpen, MoreVertical, Edit, Trash2, Search } from "lucide-react";

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

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { fetchData, postData, putData, deleteData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchData("classrooms");
    setClassrooms(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    const payload = { ...formData, period_id: localStorage.getItem("periodo") };
    if (editingClassroom) {
      await putData(`classrooms/${editingClassroom.id}/`, payload);
    } else {
      await postData("classrooms/", payload);
    }
    loadData();
    onClose();
    resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar esta aula?")) {
      await deleteData(`classrooms/${id}/`);
      loadData();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingClassroom(null);
  };

  const filtered = classrooms.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="neutral.800">Aulas</Heading>
            <Text color="neutral.500">Gestiona tus aulas y grupos</Text>
          </Box>
          <Button leftIcon={<Plus />} colorScheme="brand" onClick={() => { resetForm(); onOpen(); }}>
            Nueva Aula
          </Button>
        </Flex>
      </MotionBox>

      <Flex mb={6}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <Search color="var(--chakra-colors-neutral-400)" />
          </InputLeftElement>
          <Input
            placeholder="Buscar aula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg={cardBg}
          />
        </InputGroup>
      </Flex>

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
      ) : filtered.length === 0 ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={BookOpen} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">No hay aulas</Text>
            <Text color="neutral.500" mb={6}>Crea tu primera aula para comenzar</Text>
            <Button leftIcon={<Plus />} colorScheme="brand" onClick={onOpen} size="lg">Crear Aula</Button>
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
          {filtered.map((classroom) => (
            <MotionBox key={classroom.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
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
                    <Heading size="md" color="neutral.800">{classroom.name}</Heading>
                    <Text color="neutral.500" fontSize="sm">{classroom.description || "Sin descripción"}</Text>
                  </VStack>
                  <Menu>
                    <MenuButton as={IconButton} icon={<MoreVertical />} variant="ghost" size="sm" colorScheme="neutral" />
                    <MenuList>
                      <MenuItem icon={<Edit size={16} />} onClick={() => { setEditingClassroom(classroom); setFormData({ name: classroom.name, description: classroom.description }); onOpen(); }}>
                        Editar
                      </MenuItem>
                      <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDelete(classroom.id)}>
                        Eliminar
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
                <HStack mt={4} spacing={2}>
                  <Badge colorScheme="brand" variant="subtle">Periodo actual</Badge>
                </HStack>
              </Box>
            </MotionBox>
          ))}
        </MotionSimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent rounded="2xl">
          <ModalHeader>{editingClassroom ? "Editar Aula" : "Nueva Aula"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej. Matemáticas 101" />
              </FormControl>
              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Opcional" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="brand" onClick={handleSubmit}>{editingClassroom ? "Actualizar" : "Crear"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
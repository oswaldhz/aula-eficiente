import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box, Button, Flex, Heading, Text, Input, Spinner, Center, SimpleGrid, VStack, HStack, Badge,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  ModalFooter, FormControl, FormLabel, useColorModeValue, Icon, IconButton, Menu, MenuButton,
  MenuList, MenuItem, useToast, Alert, AlertIcon, InputGroup, InputLeftElement, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Plus, Calendar, MoreVertical, Edit, Trash2, Search } from "lucide-react";

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

export default function PeriodsPage({ selectedPeriodo, setSelectedPeriodo }) {
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({ name: "", year: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isErrorOpen, onOpen: onErrorOpen, onClose: onErrorClose } = useDisclosure();
  const toast = useToast();
  const { fetchData, postData, putData, deleteData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("neutral.200", "gray.700");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchData("periods");
    setPeriods(data);
    if (selectedPeriodo && !data.some(p => p.id.toString() === selectedPeriodo.toString())) {
      const newSel = data[0]?.id || "";
      setSelectedPeriodo(newSel);
      localStorage.setItem("periodo", newSel);
    }
    setIsLoading(false);
  };

  const filtered = periods.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.year).includes(searchTerm));

  const handleSubmit = async () => {
    if (!formData.name || !formData.year) { setErrorMessage("Campos obligatorios"); onErrorOpen(); return; }
    if (editingPeriod) {
      await putData(`periods/${editingPeriod.id}`, formData);
    } else {
      await postData("periods/", formData);
    }
    loadData();
    onClose();
    resetForm();
    window.location.reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este periodo?")) return;
    await deleteData(`periods/${id}`);
    const updated = periods.filter(p => p.id !== id);
    setPeriods(updated);
    if (selectedPeriodo === id.toString()) {
      const newSel = updated[0]?.id || "";
      setSelectedPeriodo(newSel);
      localStorage.setItem("periodo", newSel);
    }
    window.location.reload();
  };

  const resetForm = () => { setFormData({ name: "", year: "" }); setEditingPeriod(null); };

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" color="neutral.800">Periodos Académicos</Heading>
            <Text color="neutral.500">Gestiona los periodos</Text>
          </Box>
          <Button leftIcon={<Plus />} colorScheme="brand" onClick={() => { resetForm(); onOpen(); }}>
            Nuevo Periodo
          </Button>
        </Flex>
      </MotionBox>

      <HStack mb={6}>
        <InputGroup maxW="300px">
          <InputLeftElement><Search color="var(--chakra-colors-neutral-400)" /></InputLeftElement>
          <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg={cardBg} />
        </InputGroup>
      </HStack>

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="120px" rounded="2xl" />
          ))}
        </SimpleGrid>
      ) : filtered.length === 0 ? (
        <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Center py={16} flexDirection="column" bg={cardBg} rounded="2xl" borderWidth="1px" borderColor={borderColor}>
            <Icon as={Calendar} boxSize={20} color="neutral.300" mb={4} />
            <Text fontSize="xl" fontWeight="semibold" color="neutral.700">No hay periodos</Text>
            <Button leftIcon={<Plus />} mt={6} colorScheme="brand" onClick={onOpen} size="lg">Crear periodo</Button>
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
          {filtered.map((p) => (
            <MotionBox key={p.id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
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
                <Flex justify="space-between">
                  <VStack align="start">
                    <Heading size="md" color="neutral.800">{p.name}</Heading>
                    <Badge colorScheme="brand" variant="subtle">{p.year}</Badge>
                  </VStack>
                  <Menu>
                    <MenuButton as={IconButton} icon={<MoreVertical />} variant="ghost" size="sm" />
                    <MenuList>
                      <MenuItem icon={<Edit size={16} />} onClick={() => { setEditingPeriod(p); setFormData({ name: p.name, year: p.year }); onOpen(); }}>Editar</MenuItem>
                      <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDelete(p.id)}>Eliminar</MenuItem>
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
          <ModalHeader>{editingPeriod ? "Editar Periodo" : "Nuevo Periodo"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired><FormLabel>Nombre</FormLabel><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></FormControl>
              <FormControl isRequired><FormLabel>Año</FormLabel><Input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} /></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="brand" onClick={handleSubmit}>{editingPeriod ? "Actualizar" : "Crear"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isErrorOpen} onClose={onErrorClose} isCentered>
        <ModalOverlay /><ModalContent rounded="2xl"><ModalHeader>Error</ModalHeader><ModalCloseButton /><ModalBody><Alert status="error" rounded="lg"><AlertIcon />{errorMessage}</Alert></ModalBody></ModalContent>
      </Modal>
    </Box>
  );
}
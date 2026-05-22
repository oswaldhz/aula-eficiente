import React, { useState, useEffect } from "react";
import { useFetch } from "../api";
import {
  Box, SimpleGrid, Heading, Text, Flex, Badge, VStack, HStack,
  Spinner, Center, Button, Icon, useColorModeValue, Skeleton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { BookOpen, Users, ClipboardList, GraduationCap, Calendar, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Dashboard() {
  const [stats, setStats] = useState({ classrooms: 0, students: 0, activities: 0, grades: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchData } = useFetch();
  const cardBg = useColorModeValue("white", "gray.800");

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    setIsLoading(true);
    const periodo = localStorage.getItem("periodo");
    const baseUrl = periodo ? `?period_id=${periodo}` : "";
    try {
      const [classrooms, students, activities, grades] = await Promise.all([
        fetchData(`classrooms${baseUrl}`),
        fetchData(`students${baseUrl}`),
        fetchData(`activities${baseUrl}`),
        fetchData(`grades${baseUrl}`),
      ]);
      setStats({
        classrooms: classrooms.length,
        students: students.length,
        activities: activities.length,
        grades: grades.length,
      });
      setRecentActivities(activities.sort((a,b) => new Date(b.due_date) - new Date(a.due_date)).slice(0,5));
    } catch (err) { console.error(err); }
    setIsLoading(false);
  }

  const StatCard = ({ title, value, icon: IconComponent, color, link, delay = 0 }) => (
    <MotionBox
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Box
        bg={cardBg}
        shadow="sm"
        rounded="2xl"
        p={6}
        borderWidth="1px"
        borderColor="neutral.200"
        _hover={{ shadow: "xl", borderColor: `${color}.200` }}
        transition="all 0.3s"
      >
        <Flex justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="neutral.500" fontWeight="medium">{title}</Text>
            {isLoading ? (
              <Skeleton height="40px" width="60px" />
            ) : (
              <Heading size="xl" color="neutral.800">{value}</Heading>
            )}
          </VStack>
          <Box bg={`${color}.50`} p={3} rounded="xl">
            <Icon as={IconComponent} color={`${color}.600`} boxSize={6} />
          </Box>
        </Flex>
        <Button as={Link} to={link} variant="link" size="sm" rightIcon={<ArrowRight size={14} />} mt={5} colorScheme={color} fontWeight="semibold">
          Ver detalles
        </Button>
      </Box>
    </MotionBox>
  );

  return (
    <Box>
      <MotionBox initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg" color="neutral.800">Panel de Control</Heading>
            <Text color="neutral.500">Resumen general de tu periodo académico</Text>
          </Box>
        </Flex>
      </MotionBox>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard title="Aulas" value={stats.classrooms} icon={BookOpen} color="blue" link="/classrooms" delay={0} />
        <StatCard title="Estudiantes" value={stats.students} icon={Users} color="green" link="/students" delay={0.1} />
        <StatCard title="Actividades" value={stats.activities} icon={ClipboardList} color="orange" link="/activities" delay={0.2} />
        <StatCard title="Calificaciones" value={stats.grades} icon={GraduationCap} color="purple" link="/grades" delay={0.3} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <MotionBox variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
          <Box bg={cardBg} shadow="sm" rounded="2xl" p={6} borderWidth="1px" borderColor="neutral.200">
            <Flex justify="space-between" align="center" mb={5}>
              <Heading size="md" display="flex" alignItems="center" gap={2} color="neutral.800">
                <Calendar size={20} color="var(--chakra-colors-brand-500)" /> Actividades Recientes
              </Heading>
              <Button as={Link} to="/activities" size="sm" variant="ghost" rightIcon={<ArrowRight size={14} />} colorScheme="brand">Ver todas</Button>
            </Flex>
            {isLoading ? (
              <VStack spacing={4}>
                {[...Array(3)].map((_, i) => <Skeleton key={i} height="60px" width="100%" borderRadius="lg" />)}
              </VStack>
            ) : recentActivities.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {recentActivities.map((activity, idx) => (
                  <MotionBox key={activity.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Flex justify="space-between" p={4} bg="neutral.50" rounded="xl" _hover={{ bg: "brand.50" }} transition="background 0.2s">
                      <Box>
                        <Text fontWeight="semibold">{activity.title}</Text>
                        <Text fontSize="sm" color="neutral.500">Entrega: {activity.due_date ? new Date(activity.due_date).toLocaleDateString() : "N/A"}</Text>
                      </Box>
                      <Badge colorScheme="brand" variant="subtle">{activity.max_score} pts</Badge>
                    </Flex>
                  </MotionBox>
                ))}
              </VStack>
            ) : (
              <Center py={8} flexDirection="column">
                <Icon as={ClipboardList} boxSize={12} color="neutral.300" mb={3} />
                <Text color="neutral.500">No hay actividades registradas</Text>
                <Button as={Link} to="/activities" leftIcon={<Plus />} size="sm" mt={3} colorScheme="brand">Crear actividad</Button>
              </Center>
            )}
          </Box>
        </MotionBox>

        <MotionBox variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
          <Box bg={cardBg} shadow="sm" rounded="2xl" p={6} borderWidth="1px" borderColor="neutral.200">
            <Heading size="md" mb={5} color="neutral.800">Acciones Rápidas</Heading>
            <VStack spacing={3}>
              {[
                { to: "/classrooms", icon: BookOpen, label: "Gestionar Aulas" },
                { to: "/students", icon: Users, label: "Administrar Estudiantes" },
                { to: "/grades", icon: GraduationCap, label: "Calificar Actividades" },
                { to: "/reports", icon: TrendingUp, label: "Generar Reportes" },
              ].map((item, i) => (
                <MotionBox key={i} whileHover={{ x: 4 }} transition={{ duration: 0.2 }} w="full">
                  <Button as={Link} to={item.to} leftIcon={<Icon as={item.icon} />} justifyContent="flex-start" variant="outline" w="full" colorScheme="brand" size="lg">
                    {item.label}
                  </Button>
                </MotionBox>
              ))}
            </VStack>
          </Box>
        </MotionBox>
      </SimpleGrid>
    </Box>
  );
}
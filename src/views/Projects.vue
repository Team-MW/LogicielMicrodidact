<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Plus } from 'lucide-vue-next'

const projects = [
  { 
    id: 1, 
    name: 'Migration Serveur Cloud', 
    client: 'TechNova', 
    status: 'En cours', 
    progress: 65, 
    deadline: '12 Avril', 
    priority: 'Haute',
    team: ['JD', 'MC']
  },
  { 
    id: 2, 
    name: 'Formation Equipe POS', 
    client: 'SuperMarché Pro', 
    status: 'Planifié', 
    progress: 10, 
    deadline: '20 Avril', 
    priority: 'Moyenne',
    team: ['PM']
  },
  { 
    id: 3, 
    name: 'Développement Module API', 
    client: 'DevCo', 
    status: 'Terminé', 
    progress: 100, 
    deadline: '30 Mars', 
    priority: 'Basse',
    team: ['SL', 'JD']
  },
  { 
    id: 4, 
    name: 'Audit Sécurité Q2', 
    client: 'SafeBank', 
    status: 'Retard', 
    progress: 45, 
    deadline: '05 Avril', 
    priority: 'Critique',
    team: ['MC', 'PM']
  },
]
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Suivi des Projets</h2>
      <Button><Plus class="mr-2 h-4 w-4" /> Nouveau Projet</Button>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="project in projects" :key="project.id" class="flex flex-col">
        <CardHeader>
          <div class="flex items-center justify-between mb-2">
            <Badge :variant="project.status === 'Terminé' ? 'default' : project.status === 'Retard' ? 'destructive' : 'secondary'">
              {{ project.status }}
            </Badge>
            <span class="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar class="h-3 w-3" /> {{ project.deadline }}
            </span>
          </div>
          <CardTitle>{{ project.name }}</CardTitle>
          <CardDescription>Client: {{ project.client }}</CardDescription>
        </CardHeader>
        <CardContent class="flex-1 space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Progression</span>
              <span class="font-medium">{{ project.progress }}%</span>
            </div>
            <!-- Real Progress Component -->
            <Progress :model-value="project.progress" class="h-2" />
          </div>

          <div class="flex items-center justify-between pt-4">
            <div class="flex -space-x-2">
              <Avatar v-for="member in project.team" :key="member" class="h-8 w-8 border-2 border-background">
                <AvatarFallback class="text-[10px]">{{ member }}</AvatarFallback>
              </Avatar>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="text-xs">
                {{ project.priority }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

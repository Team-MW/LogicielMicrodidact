<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  ArrowRight, 
  Code2, 
  Smartphone, 
  Globe, 
  Cpu, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
  ChevronRight
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const isMenuOpen = ref(false)
const scrolled = ref(false)

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 20
  })
})

const services = [
  {
    title: 'Développement Web',
    description: 'Sites vitrines, e-commerce et applications web complexes sur mesure.',
    icon: Globe,
    color: 'blue'
  },
  {
    title: 'Applications Mobiles',
    description: 'Apps iOS et Android performantes et intuitives pour vos utilisateurs.',
    icon: Smartphone,
    color: 'indigo'
  },
  {
    title: 'Logiciels Métiers',
    description: 'Solutions personnalisées pour automatiser et optimiser vos processus.',
    icon: Cpu,
    color: 'violet'
  },
  {
    title: 'Expertise Technique',
    description: 'Audit, conseil et accompagnement dans vos choix technologiques.',
    icon: ShieldCheck,
    color: 'emerald'
  }
]

const features = [
  {
    title: 'Design Premium',
    description: 'Interfaces modernes et épurées centrées sur l\'utilisateur.',
    icon: Sparkles
  },
  {
    title: 'Performance & Vitesse',
    description: 'Optimisation maximale pour une expérience fluide.',
    icon: Zap
  },
  {
    title: 'Analytiques Intégrés',
    description: 'Suivez vos performances avec des tableaux de bord clairs.',
    icon: BarChart3
  }
]
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Navigation -->
    <nav 
      class="fixed top-0 w-full z-50 transition-all duration-300 border-b"
      :class="[scrolled ? 'bg-white/80 backdrop-blur-md py-3 border-slate-200 shadow-sm' : 'bg-transparent py-5 border-transparent']"
    >
      <div class="container mx-auto px-6 flex items-center justify-between">
        <div class="flex items-center gap-2 group cursor-pointer">
          <div class="p-2 bg-indigo-600 rounded-xl group-hover:rotate-6 transition-transform">
            <Code2 class="w-6 h-6 text-white" />
          </div>
          <span class="text-xl font-bold tracking-tight">MicroDidact</span>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-8">
          <a href="#services" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Services</a>
          <a href="#projets" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Projets</a>
          <a href="#process" class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Notre Process</a>
          <Button variant="default" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6">
            Contactez-nous
          </Button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="md:hidden p-2" @click="isMenuOpen = !isMenuOpen">
          <Menu v-if="!isMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>

      <!-- Mobile Menu -->
      <div v-if="isMenuOpen" class="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-xl">
        <a href="#services" class="text-lg font-medium py-2" @click="isMenuOpen = false">Services</a>
        <a href="#projets" class="text-lg font-medium py-2" @click="isMenuOpen = false">Projets</a>
        <a href="#process" class="text-lg font-medium py-2" @click="isMenuOpen = false">Process</a>
        <Button class="w-full bg-indigo-600 py-6">Parler d'un projet</Button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <!-- Background Elements -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
        <div class="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <div class="container mx-auto px-6">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-8 animate-fade-in">
            <Sparkles class="w-4 h-4" />
            <span>Solutions Digitales Haut de Gamme</span>
          </div>
          
          <h1 class="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Nous donnons vie à vos <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">ambitions digitales</span>
          </h1>
          
          <p class="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            MicroDidact conçoit et développe des logiciels sur mesure, des applications web et mobiles qui propulsent votre entreprise vers le futur.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-7 text-lg group">
              Démarrer un projet
              <ArrowRight class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" class="rounded-full px-8 py-7 text-lg border-2">
              Voir nos réalisations
            </Button>
          </div>
        </div>

        <!-- Hero Image/Mockup Placeholder -->
        <div class="mt-20 relative">
          <div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
          <div class="rounded-3xl border border-slate-200 shadow-2xl overflow-hidden bg-slate-900 aspect-[16/9] max-w-5xl mx-auto relative group">
            <img src="/src/assets/hero.png" alt="Development Dashboard" class="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 cursor-pointer hover:scale-110 transition-transform">
                <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <div class="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-indigo-600 border-b-[10px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Partners / Trust -->
    <section class="py-12 border-y border-slate-100 bg-slate-50/30">
      <div class="container mx-auto px-6">
        <p class="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Ils nous font confiance</p>
        <div class="flex flex-wrap justify-center items-center gap-12 lg:gap-24 grayscale opacity-50">
          <span class="text-2xl font-bold">TECHCORP</span>
          <span class="text-2xl font-bold">DIGITAL.CO</span>
          <span class="text-2xl font-bold">GLOBALSOFT</span>
          <span class="text-2xl font-bold">NEXUS</span>
          <span class="text-2xl font-bold">STRATOS</span>
        </div>
      </div>
    </section>

    <!-- Services -->
    <section id="services" class="py-24 lg:py-32">
      <div class="container mx-auto px-6">
        <div class="flex flex-col lg:flex-row justify-between items-end mb-16 gap-6">
          <div class="max-w-2xl">
            <h2 class="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-4">Nos Services</h2>
            <h3 class="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Des solutions complètes pour votre transformation numérique.
            </h3>
          </div>
          <p class="text-slate-500 lg:max-w-xs text-lg">
            De l'idée à la mise en production, nous vous accompagnons à chaque étape.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="service in services" :key="service.title" class="group p-8 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all duration-300">
            <div class="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <component :is="service.icon" class="w-7 h-7 text-indigo-600" />
            </div>
            <h4 class="text-xl font-bold mb-4">{{ service.title }}</h4>
            <p class="text-slate-600 leading-relaxed mb-6">{{ service.description }}</p>
            <a href="#" class="inline-flex items-center text-indigo-600 font-semibold group/link">
              En savoir plus
              <ChevronRight class="ml-1 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-slate-900 text-white rounded-[3rem] mx-4 lg:mx-10 overflow-hidden relative">
      <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 class="text-4xl lg:text-5xl font-bold mb-8 leading-tight">Pourquoi choisir MicroDidact pour vos projets ?</h2>
            <div class="space-y-8">
              <div v-for="feat in features" :key="feat.title" class="flex gap-6">
                <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <component :is="feat.icon" class="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 class="text-xl font-bold mb-2">{{ feat.title }}</h4>
                  <p class="text-slate-400 leading-relaxed">{{ feat.description }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="relative">
            <div class="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-3xl relative">
              <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-xl font-bold">M</div>
                <div>
                  <div class="font-bold text-lg">Logiciel MicroDidact</div>
                  <div class="text-indigo-400 text-sm">Prêt pour le déploiement</div>
                </div>
              </div>
              <div class="space-y-4">
                <div class="h-2 bg-slate-700 rounded-full w-full">
                  <div class="h-full bg-indigo-500 rounded-full w-[95%]"></div>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-slate-400">Progression du projet</span>
                  <span class="text-indigo-400 font-bold">95%</span>
                </div>
                <div class="pt-6 grid grid-cols-2 gap-4">
                  <div class="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div class="text-xs text-slate-400 mb-1">Performance</div>
                    <div class="text-2xl font-bold text-emerald-400">99.9</div>
                  </div>
                  <div class="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div class="text-xs text-slate-400 mb-1">Sécurité</div>
                    <div class="text-2xl font-bold text-indigo-400">A+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-24">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-12">
          <div class="text-center">
            <div class="text-5xl font-bold text-indigo-600 mb-2">50+</div>
            <div class="text-slate-500 font-medium">Projets Livrés</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-indigo-600 mb-2">12</div>
            <div class="text-slate-500 font-medium">Experts Dédiés</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-indigo-600 mb-2">100%</div>
            <div class="text-slate-500 font-medium">Clients Satisfaits</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-indigo-600 mb-2">5+</div>
            <div class="text-slate-500 font-medium">Années d'Expérience</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 lg:py-32">
      <div class="container mx-auto px-6">
        <div class="bg-indigo-600 rounded-[3rem] p-12 lg:p-24 text-center text-white relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-700 to-blue-600 -z-10"></div>
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
          
          <h2 class="text-4xl lg:text-6xl font-bold mb-8">Prêt à transformer votre vision en réalité ?</h2>
          <p class="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Discutons de votre projet aujourd'hui. Notre équipe d'experts est prête à relever vos défis technologiques les plus ambitieux.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" class="bg-white text-indigo-600 hover:bg-slate-50 rounded-full px-10 py-8 text-xl font-bold shadow-xl">
              Parlons de votre projet
            </Button>
            <a href="mailto:contact@microdidact.com" class="text-white font-semibold flex items-center gap-2 text-lg hover:underline underline-offset-4">
              <MessageSquare class="w-6 h-6" />
              contact@microdidact.com
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
      <div class="container mx-auto px-6">
        <div class="grid lg:grid-cols-4 gap-12 mb-16">
          <div class="lg:col-span-1">
            <div class="flex items-center gap-2 mb-6">
              <div class="p-1.5 bg-indigo-600 rounded-lg">
                <Code2 class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold tracking-tight">MicroDidact</span>
            </div>
            <p class="text-slate-500 leading-relaxed mb-8">
              Expertise en développement sur mesure pour entreprises ambitieuses. Qualité, performance et innovation au service de votre croissance.
            </p>
          </div>
          
          <div>
            <h5 class="font-bold mb-6 text-slate-900">Services</h5>
            <ul class="space-y-4 text-slate-600">
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Développement Web</a></li>
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Applications Mobiles</a></li>
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Logiciels Métiers</a></li>
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Audit & Conseil</a></li>
            </ul>
          </div>

          <div>
            <h5 class="font-bold mb-6 text-slate-900">Entreprise</h5>
            <ul class="space-y-4 text-slate-600">
              <li><a href="#" class="hover:text-indigo-600 transition-colors">À propos</a></li>
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Projets</a></li>
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Blog</a></li>
              <li><a href="#" class="hover:text-indigo-600 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h5 class="font-bold mb-6 text-slate-900">Contact</h5>
            <ul class="space-y-4 text-slate-600">
              <li class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Globe class="w-4 h-4 text-indigo-600" />
                </div>
                <span>Paris, France</span>
              </li>
              <li class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageSquare class="w-4 h-4 text-indigo-600" />
                </div>
                <span>contact@microdidact.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2024 MicroDidact. Tous droits réservés.</p>
          <div class="flex gap-8">
            <a href="#" class="hover:text-indigo-600 transition-colors">Mentions Légales</a>
            <a href="#" class="hover:text-indigo-600 transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}

.container {
  max-width: 1280px;
}

html {
  scroll-behavior: smooth;
}
</style>

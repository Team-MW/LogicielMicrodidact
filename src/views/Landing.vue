<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  ArrowRight, 
  Code2, 
  Smartphone, 
  Globe, 
  Cpu, 
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
  Database,
  Layers,
  Terminal,
  Server
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const isMenuOpen = ref(false)
const scrolled = ref(false)

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 20
  })
})

const techStack = [
  { name: 'Vue.js', icon: Globe },
  { name: 'TypeScript', icon: Code2 },
  { name: 'Node.js', icon: Server },
  { name: 'PostgreSQL', icon: Database },
  { name: 'Tailwind CSS', icon: Layers },
  { name: 'Docker', icon: Terminal },
  { name: 'AWS', icon: Globe },
  { name: 'Flutter', icon: Smartphone }
]

const services = [
  {
    title: 'Développement Web',
    description: 'Ecosystèmes web performants, d\'Apps complexes aux architectures micro-services.',
    icon: Globe,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    title: 'Mobile Native',
    description: 'Expériences mobiles immersives sur iOS et Android avec une fluidité absolue.',
    icon: Smartphone,
    color: 'from-indigo-600 to-blue-500'
  },
  {
    title: 'Logiciels SaaS',
    description: 'Plateformes industrielles scalables conçues pour la croissance exponentielle.',
    icon: Cpu,
    color: 'from-violet-600 to-indigo-500'
  },
  {
    title: 'DevOps & Cloud',
    description: 'Infrastructures haute disponibilité, sécurisées et optimisées pour le cloud.',
    icon: ShieldCheck,
    color: 'from-emerald-600 to-teal-500'
  }
]

const features = [
  {
    title: 'Architecture Future-Proof',
    description: 'Nous codons pour demain, avec des structures scalables et maintenables.',
    icon: Layers
  },
  {
    title: 'Vitesse de Livraison',
    description: 'Méthodologie Agile pure pour des cycles de développement ultra-rapides.',
    icon: Zap
  },
  {
    title: 'Intelligence Data',
    description: 'Intégration intuitive de l\'IA et du Big Data au cœur de vos processus.',
    icon: BarChart3
  }
]
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden">
    <!-- Animated Background Blobs -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div class="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob"></div>
      <div class="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] animate-blob animation-delay-2000"></div>
      <div class="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
    </div>

    <!-- Navigation -->
    <nav 
      class="fixed top-0 w-full z-50 transition-all duration-500 border-b"
      :class="[scrolled ? 'bg-black/60 backdrop-blur-xl py-4 border-white/10 shadow-2xl shadow-indigo-500/5' : 'bg-transparent py-6 border-transparent']"
    >
      <div class="container mx-auto px-6 flex items-center justify-between">
        <div class="flex items-center gap-3 group cursor-pointer">
          <div class="relative">
            <div class="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
            <div class="relative p-2 bg-black rounded-xl border border-white/10 group-hover:rotate-12 transition-transform duration-500">
              <Code2 class="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <span class="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">MICRODIDACT</span>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-10">
          <a v-for="link in ['Services', 'Projets', 'Process']" :key="link" :href="'#' + link.toLowerCase()" class="text-sm font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">{{ link }}</a>
          
          <div class="flex items-center gap-4 pl-4 border-l border-white/10">
            <button class="text-sm font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors" @click="$router.push('/dashboard')">
              Accès Logiciel
            </button>
            <Button variant="default" class="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 py-6 font-bold uppercase tracking-widest text-xs h-auto shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              Contact
            </Button>
          </div>
        </div>

        <button class="md:hidden p-2 text-white/70" @click="isMenuOpen = !isMenuOpen">
          <Menu v-if="!isMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-40 pb-32 lg:pt-56 lg:pb-48">
      <div class="container mx-auto px-6">
        <div class="max-w-5xl mx-auto text-center relative z-10">
          <div class="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-12 animate-fade-in shadow-2xl">
            <Sparkles class="w-3 h-3 text-yellow-400" />
            <span>Forge numérique de précision</span>
          </div>
          
          <h1 class="text-6xl lg:text-[8rem] font-black tracking-tighter mb-12 leading-[0.85] animate-reveal">
            TRANSFORMEZ L'IDÉE EN <span class="text-transparent bg-clip-text bg-gradient-to-b from-indigo-400 via-indigo-600 to-blue-700">CODE</span>
          </h1>
          
          <p class="text-xl lg:text-2xl text-white/50 mb-14 leading-relaxed max-w-2xl mx-auto font-medium">
            Nous ne construisons pas seulement des logiciels. Nous bâtissons les moteurs de votre succès digital.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" class="bg-white text-black hover:bg-indigo-500 hover:text-white rounded-full px-12 py-8 text-lg font-black uppercase tracking-widest transition-all duration-500 group">
              Démarrer le voyage
              <ArrowRight class="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
            <button class="group flex items-center gap-3 text-white/50 hover:text-white font-bold uppercase tracking-widest text-sm transition-all duration-300">
              <span class="w-12 h-[1px] bg-white/20 group-hover:w-20 group-hover:bg-indigo-500 transition-all duration-500"></span>
              Portfolio
            </button>
          </div>
        </div>

        <!-- Floating Dashboard Mockup -->
        <div class="mt-32 relative max-w-6xl mx-auto perspective-3000">
          <div class="absolute -inset-10 bg-indigo-600/20 blur-[100px] rounded-full opacity-50"></div>
          <div class="relative rounded-[2rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden bg-[#0A0A0A] aspect-[16/9] animate-float rotate-x-6 rotate-y--6 group hover:rotate-x-0 hover:rotate-y-0 transition-all duration-1000">
            <img src="/src/assets/hero.png" alt="Dev Dashboard" class="w-full h-full object-cover opacity-80" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Infinite Scrolling Marquee -->
    <section class="py-20 border-y border-white/5 bg-white/[0.02] relative overflow-hidden">
      <div class="flex animate-marquee whitespace-nowrap gap-16 items-center">
        <div v-for="i in 4" :key="i" class="flex gap-16 items-center shrink-0">
          <div v-for="tech in techStack" :key="tech.name" class="flex items-center gap-4 group cursor-default">
            <component :is="tech.icon" class="w-8 h-8 text-white/20 group-hover:text-indigo-500 transition-colors duration-500" />
            <span class="text-3xl font-black uppercase tracking-tighter text-white/10 group-hover:text-white/80 transition-colors duration-500">{{ tech.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Grid -->
    <section id="services" class="py-32 lg:py-56 relative">
      <div class="container mx-auto px-6">
        <div class="flex flex-col lg:flex-row justify-between items-start mb-24 gap-12">
          <div class="max-w-3xl">
            <h2 class="text-indigo-500 font-black tracking-[0.3em] uppercase text-xs mb-6">Expertise Industrielle</h2>
            <h3 class="text-5xl lg:text-7xl font-black leading-none tracking-tighter mb-8">
              UNE VISION <span class="italic text-white/30">HORS NORME</span> POUR VOS PROJETS.
            </h3>
          </div>
          <div class="lg:w-1/3 pt-4">
            <div class="w-20 h-[2px] bg-indigo-600 mb-8"></div>
            <p class="text-white/40 text-lg font-medium leading-relaxed">
              Nous fusionnons design d'avant-garde et ingénierie de pointe pour créer des solutions qui ne se contentent pas de fonctionner. Elles dominent.
            </p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="service in services" :key="service.title" class="group relative p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-700 hover:-translate-y-4">
            <div class="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
               <ArrowRight class="w-6 h-6 text-indigo-400 rotate-[-45deg]" />
            </div>
            <div :class="['w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-10 shadow-lg', service.color]">
               <component :is="service.icon" class="w-8 h-8 text-white" />
            </div>
            <h4 class="text-2xl font-black mb-6 uppercase tracking-tight leading-none">{{ service.title }}</h4>
            <p class="text-white/40 font-medium leading-[1.6] mb-8 group-hover:text-white/70 transition-colors duration-700">{{ service.description }}</p>
            <div class="mt-auto h-1 w-0 bg-indigo-600 group-hover:w-full transition-all duration-700"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- High Impact Features -->
    <section class="py-32 bg-white text-black rounded-[4rem] mx-4 lg:mx-8 overflow-hidden relative shadow-[0_50px_100px_rgba(79,70,229,0.2)]">
      <div class="container mx-auto px-6">
        <div class="grid lg:grid-cols-2 gap-32 items-center">
          <div class="space-y-16">
            <h2 class="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter">POURQUOI NOUS ?</h2>
            <div class="space-y-12">
              <div v-for="feat in features" :key="feat.title" class="group flex gap-8">
                <div class="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <component :is="feat.icon" class="w-6 h-6" />
                </div>
                <div>
                  <h4 class="text-2xl font-black mb-4 uppercase tracking-tight">{{ feat.title }}</h4>
                  <p class="text-black/50 font-medium leading-relaxed">{{ feat.description }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="relative group">
            <div class="absolute -inset-10 bg-indigo-500/30 blur-[80px] rounded-full group-hover:bg-indigo-500/50 transition-colors duration-1000"></div>
            <div class="relative bg-black rounded-[3rem] p-12 overflow-hidden shadow-2xl">
               <div class="space-y-10">
                 <div class="flex justify-between items-center text-white/50 text-xs font-black uppercase tracking-[0.3em]">
                   <span>System Status</span>
                   <span class="text-emerald-400">Online</span>
                 </div>
                 <div class="space-y-12 py-10">
                   <div v-for="i in 3" :key="i" class="space-y-4">
                     <div class="flex justify-between text-sm font-bold text-white uppercase tracking-widest">
                       <span>Optimization {{ i }}</span>
                       <span class="text-indigo-400">9{{ i }}%</span>
                     </div>
                     <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div class="h-full bg-indigo-600 rounded-full animate-grow" :style="{ width: (80 + i*5) + '%' }"></div>
                     </div>
                   </div>
                 </div>
                 <Button class="w-full bg-white text-black font-black uppercase py-8 rounded-2xl hover:bg-indigo-500 hover:text-white transition-colors">Propulser mon projet</Button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Big CTA -->
    <section class="py-56 relative overflow-hidden">
      <div class="container mx-auto px-6 text-center">
        <h2 class="text-[10vw] font-black uppercase tracking-tighter leading-[0.8] mb-20 text-white/5 pointer-events-none select-none">RELEVEZ LE DÉFI</h2>
        <div class="relative z-10">
          <h3 class="text-5xl lg:text-[6rem] font-black tracking-tighter mb-16 leading-none">VOTRE PROCHAIN SUCCÈS <br/> COMMENCE <span class="italic text-indigo-500 underline decoration-indigo-500/30">ICI</span>.</h3>
          <Button size="lg" class="bg-indigo-600 hover:bg-white hover:text-black rounded-full px-16 py-10 text-xl font-black uppercase tracking-widest transition-all duration-500 shadow-[0_0_50px_rgba(79,70,229,0.5)]">
            Contactez l'élite
          </Button>
        </div>
      </div>
    </section>

    <!-- Minimal Footer -->
    <footer class="py-20 border-t border-white/5">
      <div class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
             <Code2 class="w-4 h-4 text-white" />
          </div>
          <span class="font-black tracking-widest uppercase text-sm">MICRODIDACT — 2024</span>
        </div>
        <div class="flex gap-12 text-xs font-black uppercase tracking-[0.2em] text-white/40">
           <a href="#" class="hover:text-white transition-colors">Privacy</a>
           <a href="#" class="hover:text-white transition-colors">Legal</a>
           <a href="#" class="hover:text-white transition-colors">Terms</a>
        </div>
        <div class="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">
           Designed with precision
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% { transform: scale(1) translate(0, 0); }
  33% { transform: scale(1.1) translate(30px, -50px); }
  66% { transform: scale(0.9) translate(-20px, 20px); }
  100% { transform: scale(1) translate(0, 0); }
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes float {
  0% { transform: translateY(0) rotateX(6deg) rotateY(-6deg); }
  50% { transform: translateY(-30px) rotateX(10deg) rotateY(-3deg); }
  100% { transform: translateY(0) rotateX(6deg) rotateY(-6deg); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes grow {
  from { width: 0; }
}

@keyframes reveal {
  from { clip-path: inset(100% 0 0 0); transform: translateY(50px); }
  to { clip-path: inset(0 0 0 0); transform: translateY(0); }
}

.animate-blob {
  animation: blob 10s infinite ease-in-out;
}

.animate-marquee {
  animation: marquee 40s linear infinite;
}

.animate-float {
  animation: float 8s infinite ease-in-out;
}

.animate-fade-in {
  animation: fade-in 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-grow {
  animation: grow 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-reveal {
  animation: reveal 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

.perspective-3000 {
  perspective: 3000px;
}

.rotate-x-6 { transform: rotateX(6deg); }
.rotate-y--6 { transform: rotateY(-6deg); }

html {
  scroll-behavior: smooth;
}

.container {
  max-width: 1400px;
}
</style>

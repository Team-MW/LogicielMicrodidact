# Guide d'Intégration API Vercel

Oui, il est tout à fait possible de se connecter à l'API de Vercel pour récupérer la liste de vos sites (projets) déployés. Voici comment procéder pour intégrer cette fonctionnalité dans votre application **MicroDidact**.

## 1. Pré-requis
Pour communiquer avec Vercel, vous avez besoin d'un **Token d'Accès Personnel (PAT)**.
1. Allez dans vos **Vercel Settings** > **Tokens**.
2. Créez un nouveau token (ex: `MICRODIDACT_API`).
3. Notez précieusement ce token.

## 2. L'Endpoint Principal
L'API Vercel utilise des requêtes HTTP standard. Pour obtenir la liste des projets, l'endpoint est :
`GET https://api.vercel.com/v9/projects`

## 3. Exemple d'implémentation (Javascript/Typescript)

Voici comment vous pourriez structurer l'appel dans votre fichier `src/services/api.ts` :

```typescript
const VERCEL_TOKEN = 'VOTRE_TOKEN_ICI';

export const vercelService = {
  async getProjects() {
    try {
      const response = await fetch('https://api.vercel.com/v9/projects', {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      });
      
      if (!response.ok) throw new Error('Erreur Vercel API');
      
      const data = await response.json();
      return data.projects; // Renvoie la liste des sites/projets
    } catch (error) {
      console.error('Erreur lors de la récupération des projets Vercel:', error);
      return [];
    }
  }
}
```

## 4. Intégration dans MicroDidact

Pour que cela fonctionne dans votre interface actuelle, voici la marche à suivre :

1. **Sécurité** : Ne mettez jamais votre Token en clair dans le code si l'application est publique. Utilisez des variables d'environnement (`.env`).
2. **Mapping** : Une fois les projets récupérés, vous pouvez les faire correspondre à vos clients dans votre interface "Sites Web".
3. **Automatisation** : Vous pourriez ajouter un bouton "Importer depuis Vercel" qui remplirait automatiquement votre liste de sites.

## 5. Données Récupérables
Via l'API Vercel, vous pouvez obtenir :
- Le nom du projet.
- L'URL de déploiement (`latestDeployments`).
- Le statut du dernier déploiement (Ready, Error, Building).
- Le framework utilisé.
- Les logs de déploiement.

---

> [!TIP]
> Si vous souhaitez également avoir des statistiques de trafic (Analytics), Vercel propose des endpoints spécifiques, mais cela nécessite que Vercel Analytics soit activé sur vos projets.

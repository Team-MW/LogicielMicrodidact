#!/bin/bash

echo "🧹 Nettoyage du cache Vite..."
rm -rf node_modules/.vite

echo "🚀 Démarrage de Vite..."
npx vite &
VITE_PID=$!

echo "⏳ En attente du pré-bundling des dépendances..."
echo "   (première fois peut prendre 30-60 secondes)"

# Attend que le fichier deps_metadata.json existe (signe que le bundling est fini)
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  if [ -f "node_modules/.vite/deps/_metadata.json" ]; then
    echo "✅ Dépendances pré-bundlées!"
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  echo "   ... ($WAITED s)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo "⚠️  Timeout - ouverture quand même"
fi

echo "🌍 Ouverture dans le navigateur..."
sleep 1
open http://127.0.0.1:5173/

echo "✅ App lancée! Ctrl+C pour arrêter."
wait $VITE_PID

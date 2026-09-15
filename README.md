# Blox Arcade

Arcade virtuelle communautaire Next.js avec coins virtuels, comptes, Rocket solo, courses de chevaux multi-joueurs synchronisées, historique LIVE, chat public, XP/profil, daily, classement et shop.

## Jeux
- Towers
- Chevaux LIVE : 5 chevaux, fenêtre de mise 5 secondes + course 5 secondes, nouvelle manche toutes les 10 secondes
- Plinko
- Blackjack
- Roulette
- Rocket Solo : multiplicateur lent, mise débitée une seule fois, paiement uniquement lors d'un encaissement réussi
- Dice
- Hi-Lo

## Profil
Le profil complet est disponible sur `/profile` avec XP, niveau, statistiques, daily, classement, cosmétiques, historique et réglages.

## Variables d'environnement
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SESSION_SECRET` (32 caractères ou plus recommandé)
- `SHOP_ADMIN_SECRET` (si le shop/admin est utilisé)

## Lancer
```bash
npm install
npm run dev
```

Les coins sont purement virtuels et n'ont aucune valeur monétaire.

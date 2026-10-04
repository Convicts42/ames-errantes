# Configurer les notifications WhatsApp

L’intégration utilise l’API officielle WhatsApp Business Platform de Meta. L’application WhatsApp Business sur téléphone, à elle seule, ne fournit pas les accès nécessaires. Le site est prêt à être connecté, mais aucun compte Meta ni numéro n’a été créé par l’agent.

## 1. Préparer Meta

Suivre [le guide officiel Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) pour créer/configurer le portefeuille Business, l’application, le compte WhatsApp Business et son numéro. Les validations, frais et conditions applicables sont ceux indiqués par Meta lors de l’inscription. Le propriétaire devra effectuer lui-même la connexion, les vérifications et toute validation de facturation. Aucun achat n’est effectué par le site.

Créer deux modèles en français, chacun avec un unique paramètre de corps `{{1}}`, puis attendre leur approbation :

- `ame_errante_nouvelle_demande` : « Nouvelle demande reçue. Référence : {{1}}. Consultez l’administration. »
- `ame_errante_accuse_reception` : « Votre demande a bien été enregistrée. Référence : {{1}}. L’équipe reviendra vers vous. »

Ne pas ajouter de variable de nom, d’e-mail ou de contenu de dossier. Les modèles doivent correspondre aux textes autorisés. La catégorie et l’approbation sont décidées par Meta. Dans son environnement de test, ajouter les numéros destinataires autorisés.

## 2. Renseigner le serveur

Copier les variables commentées de `.env.example` vers `.env.local`, sans exposer ce fichier dans Git ou dans le navigateur :

```dotenv
WHATSAPP_API_VERSION=vXX.0
WHATSAPP_PHONE_NUMBER_ID=identifiant_numerique_du_numero
WHATSAPP_ACCESS_TOKEN=jeton_serveur_fourni_par_meta
WHATSAPP_TEAM_TEMPLATE=ame_errante_nouvelle_demande
WHATSAPP_RECEIPT_TEMPLATE=ame_errante_accuse_reception
WHATSAPP_LANGUAGE=fr
WHATSAPP_APP_SECRET=secret_de_l_application_meta
WHATSAPP_VERIFY_TOKEN=valeur_longue_aleatoire_choisie_pour_le_webhook
```

Remplacer `vXX.0` par la version API supportée indiquée dans le tableau de bord Meta. Utiliser un jeton serveur adapté à la production et gérer son expiration. Redémarrer Next.js après modification.

## 3. Connecter le suivi de livraison

Sur un hébergement public HTTPS, configurer `https://votre-domaine/api/whatsapp/webhook` et la même valeur de vérification dans Meta. S’abonner au champ `messages`. Une adresse privée telle que `192.168.1.7` n’est pas accessible depuis Meta : les envois sortants peuvent être testés localement, mais les callbacks de livraison et STOP nécessitent une URL HTTPS joignable.

Le serveur vérifie la signature HMAC SHA-256 des événements avec le secret d’application avant toute modification. Il traite les états envoyé/livré/lu/échec et les réponses STOP/ARRÊT, sans stocker les conversations entrantes. Hors webhook actif, les retraits d’accord doivent être traités manuellement par l’équipe ; ne pas ouvrir les notifications visiteurs au public sans ce mécanisme.

## 4. Activer et vérifier

Dans Administration → Réglages et WhatsApp :

1. Renseigner le numéro destinataire de l’équipe au format international, par exemple `+336…`, et confirmer son accord.
2. Activer les notifications et enregistrer.
3. Envoyer une demande de contact de test avec ses propres coordonnées et, si souhaité, demander l’accusé WhatsApp. Les profils fictifs d’animaux ne génèrent pas d’alerte.
4. Attendre le passage du service (environ une minute) et vérifier le téléphone ainsi que l’historique dans l’administration. Supprimer ensuite le dossier de test.

« Accepté par Meta » signifie que l’API a accepté l’envoi, pas que le téléphone l’a reçu. Seul le callback signé confirme la livraison. Le site n’émet aucun message libre hors modèle.

## Fiabilité et confidentialité

La demande et ses notifications sont enregistrées dans la même transaction SQLite. Une nouvelle tentative du formulaire ne duplique pas les alertes. Le service reprend les notifications en attente après redémarrage. Les erreurs de quota HTTP 429 sont retentées jusqu’à cinq tentatives avec délai croissant. Une coupure ou une réponse ambiguë est marquée « À vérifier » sans relance automatique pour limiter les doublons ; un responsable peut relancer après avoir vérifié WhatsApp. Les erreurs explicites sont visibles et peuvent être reprises après correction.

Les destinataires et références nécessaires sont transmis uniquement à `graph.facebook.com`, avec les paramètres du modèle. Les limites par e-mail, par numéro et globales réduisent les abus. Le consentement WhatsApp est distinct de l’accord de traitement du dossier. Une notification en attente vers un ancien numéro d’équipe est annulée si le réglage change. Désactiver le service suspend les envois en attente ; les effacer avec le dossier si leur envoi n’est plus souhaité.

Références : [requête officielle Meta](https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text), [exemple officiel de validation des signatures](https://github.com/fbsamples/whatsapp-api-examples/blob/main/signature-validation-with-webhooks-payloads/app.py), [politique WhatsApp Business](https://business.whatsapp.com/policy), [information des personnes — CNIL](https://www.cnil.fr/fr/informer-les-personnes).

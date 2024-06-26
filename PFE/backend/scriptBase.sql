-- Create the tables
CREATE TABLE vente (
    Vente	INT,
    Date	date,
    Heure	time(6),
    CodeMag	VARCHAR(512),
    Total	numeric,--Majuscule--
    Quantite	INT,
    Nature	VARCHAR(512),
    Vendeur	VARCHAR(512),
    NumeroFacture	INT,
    Utilisateur	VARCHAR(512),
    NumeroFactureJour	numeric,
    VShopStatus	VARCHAR(512)
);

CREATE TABLE client (
    Client	INT,
    Nom		VARCHAR(512),
    Prenom	VARCHAR(512),
    Adresse	VARCHAR(512),
    Portable	INT,
    Email	VARCHAR(512),
    DateNaissance	date,
    Sexe	VARCHAR(512),
    CarteFidelite	VARCHAR(512),
    MagasinCreation	VARCHAR(512),
    DateCreation	date,
    NbPassage	INT,
    totalca	numeric,
    DateModif	TIMESTAMP,
    UtilisateurCreation	VARCHAR(512),
    cumulca	numeric,
    montant_dernierachat	numeric,
    Date_DernierAchat	date,
    MagasinCreationOrigine	VARCHAR(512)
);

CREATE TABLE lignes (
    Ligne	INT,
    Vente_id	INT,
    StockID	INT,
    CodeMag_id	VARCHAR(512),
    Fournisseur	VARCHAR(512),
    Reception	date,
    Origine	VARCHAR(512),
    Famille	VARCHAR(512),
    BarCode	VARCHAR(512),
    Designation	VARCHAR(512),
    prixachat	numeric,
    prixvente	numeric,
    prix	numeric,
    Quantite	INT,--Majuscule--
    Remise	numeric,
    Total	numeric,--Majuscule--
    Motif	VARCHAR(512),
    TVA	INT
);

CREATE TABLE stock (
    stockid	INT,
    CodeMag	VARCHAR(512),
    Fournisseur	VARCHAR(512),
    Date	date,
    Origine	VARCHAR(512),
    Famille	VARCHAR(512),
    BarCode	VARCHAR(512),
    Designation	VARCHAR(512),
    prixachat	numeric,
    prixvente	numeric,
    Qte		INT,
    ArDate	date
);

CREATE TABLE produit (
    BarCode	VARCHAR(512),
    prixvente	numeric
);
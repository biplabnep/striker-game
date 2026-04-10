import { Position, PlayerAttributes } from './types';

// ============================================================
// Elite Striker - Player Data & Generation Utilities
// ============================================================

// -----------------------------------------------------------
// Position weights for OVR calculation
// Different positions weight attributes differently
// -----------------------------------------------------------
export const POSITION_WEIGHTS: Record<Position, Record<keyof PlayerAttributes, number>> = {
  GK:  { pace: 0.05, shooting: 0.0,  passing: 0.10, dribbling: 0.0,  defending: 0.10, physical: 0.15, diving: 0.25, handling: 0.15, positioning: 0.10, reflexes: 0.20 },
  CB:  { pace: 0.10, shooting: 0.02, passing: 0.10, dribbling: 0.05, defending: 0.40, physical: 0.30 },
  LB:  { pace: 0.20, shooting: 0.03, passing: 0.15, dribbling: 0.10, defending: 0.30, physical: 0.20 },
  RB:  { pace: 0.20, shooting: 0.03, passing: 0.15, dribbling: 0.10, defending: 0.30, physical: 0.20 },
  CDM: { pace: 0.08, shooting: 0.08, passing: 0.20, dribbling: 0.10, defending: 0.35, physical: 0.20 },
  CM:  { pace: 0.10, shooting: 0.12, passing: 0.25, dribbling: 0.18, defending: 0.15, physical: 0.18 },
  CAM: { pace: 0.10, shooting: 0.20, passing: 0.25, dribbling: 0.25, defending: 0.05, physical: 0.12 },
  LW:  { pace: 0.25, shooting: 0.22, passing: 0.12, dribbling: 0.25, defending: 0.03, physical: 0.10 },
  RW:  { pace: 0.25, shooting: 0.22, passing: 0.12, dribbling: 0.25, defending: 0.03, physical: 0.10 },
  LM:  { pace: 0.20, shooting: 0.15, passing: 0.20, dribbling: 0.20, defending: 0.08, physical: 0.14 },
  RM:  { pace: 0.20, shooting: 0.15, passing: 0.20, dribbling: 0.20, defending: 0.08, physical: 0.14 },
  ST:  { pace: 0.18, shooting: 0.35, passing: 0.08, dribbling: 0.18, defending: 0.02, physical: 0.18 },
  CF:  { pace: 0.12, shooting: 0.28, passing: 0.18, dribbling: 0.22, defending: 0.03, physical: 0.15 },
};

// -----------------------------------------------------------
// Nationalities with flags
// -----------------------------------------------------------
export const NATIONALITIES = [
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', league: 'premier_league' },
  { name: 'Spain', flag: '🇪🇸', league: 'la_liga' },
  { name: 'Italy', flag: '🇮🇹', league: 'serie_a' },
  { name: 'Germany', flag: '🇩🇪', league: 'bundesliga' },
  { name: 'France', flag: '🇫🇷', league: 'ligue_1' },
  { name: 'Brazil', flag: '🇧🇷', league: null },
  { name: 'Argentina', flag: '🇦🇷', league: null },
  { name: 'Portugal', flag: '🇵🇹', league: null },
  { name: 'Netherlands', flag: '🇳🇱', league: null },
  { name: 'Belgium', flag: '🇧🇪', league: null },
  { name: 'Croatia', flag: '🇭🇷', league: null },
  { name: 'Uruguay', flag: '🇺🇾', league: null },
  { name: 'Colombia', flag: '🇨🇴', league: null },
  { name: 'Morocco', flag: '🇲🇦', league: null },
  { name: 'Nigeria', flag: '🇳🇬', league: null },
  { name: 'Senegal', flag: '🇸🇳', league: null },
  { name: 'South Korea', flag: '🇰🇷', league: null },
  { name: 'Japan', flag: '🇯🇵', league: null },
  { name: 'Mexico', flag: '🇲🇽', league: null },
  { name: 'USA', flag: '🇺🇸', league: null },
  { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', league: null },
  { name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', league: null },
  { name: 'Ireland', flag: '🇮🇪', league: null },
  { name: 'Poland', flag: '🇵🇱', league: null },
  { name: 'Serbia', flag: '🇷🇸', league: null },
  { name: 'Turkey', flag: '🇹🇷', league: null },
  { name: 'Sweden', flag: '🇸🇪', league: null },
  { name: 'Norway', flag: '🇳🇴', league: null },
  { name: 'Denmark', flag: '🇩🇰', league: null },
  { name: 'Switzerland', flag: '🇨🇭', league: null },
  { name: 'Austria', flag: '🇦🇹', league: null },
  { name: 'Czech Republic', flag: '🇨🇿', league: null },
  { name: 'Ghana', flag: '🇬🇭', league: null },
  { name: 'Cameroon', flag: '🇨🇲', league: null },
  { name: 'Ivory Coast', flag: '🇨🇮', league: null },
  { name: 'Chile', flag: '🇨🇱', league: null },
  { name: 'Ecuador', flag: '🇪🇨', league: null },
  { name: 'Australia', flag: '🇦🇺', league: null },
  { name: 'Canada', flag: '🇨🇦', league: null },
  { name: 'Ukraine', flag: '🇺🇦', league: null },
] as const;

// -----------------------------------------------------------
// Position details
// -----------------------------------------------------------
export const POSITIONS: Record<Position, { fullName: string; category: string; abbreviation: string }> = {
  GK:  { fullName: 'Goalkeeper', category: 'Goalkeeping', abbreviation: 'GK' },
  CB:  { fullName: 'Center Back', category: 'Defence', abbreviation: 'CB' },
  LB:  { fullName: 'Left Back', category: 'Defence', abbreviation: 'LB' },
  RB:  { fullName: 'Right Back', category: 'Defence', abbreviation: 'RB' },
  CDM: { fullName: 'Central Defensive Midfielder', category: 'Midfield', abbreviation: 'CDM' },
  CM:  { fullName: 'Central Midfielder', category: 'Midfield', abbreviation: 'CM' },
  CAM: { fullName: 'Central Attacking Midfielder', category: 'Midfield', abbreviation: 'CAM' },
  LW:  { fullName: 'Left Winger', category: 'Attack', abbreviation: 'LW' },
  RW:  { fullName: 'Right Winger', category: 'Attack', abbreviation: 'RW' },
  LM:  { fullName: 'Left Midfielder', category: 'Midfield', abbreviation: 'LM' },
  RM:  { fullName: 'Right Midfielder', category: 'Midfield', abbreviation: 'RM' },
  ST:  { fullName: 'Striker', category: 'Attack', abbreviation: 'ST' },
  CF:  { fullName: 'Center Forward', category: 'Attack', abbreviation: 'CF' },
};

// -----------------------------------------------------------
// Player traits
// -----------------------------------------------------------
export const PLAYER_TRAITS = [
  // Positive
  { id: 'leader', name: 'Leader', description: 'Inspires teammates, boosts team morale', type: 'positive' as const },
  { id: 'clutch_player', name: 'Clutch Player', description: 'Performs better in crucial moments', type: 'positive' as const },
  { id: 'free_kick_specialist', name: 'Free Kick Specialist', description: 'Exceptional at free kicks', type: 'positive' as const },
  { id: 'penalty_specialist', name: 'Penalty Specialist', description: 'Rarely misses from the spot', type: 'positive' as const },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Exceptional pace and acceleration', type: 'positive' as const },
  { id: 'technical_dribbler', name: 'Technical Dribbler', description: 'Uses skill moves to beat defenders', type: 'positive' as const },
  { id: 'power_header', name: 'Power Header', description: 'Dominant in aerial duels', type: 'positive' as const },
  { id: 'long_shot', name: 'Long Shot Taker', description: 'Can score from distance', type: 'positive' as const },
  { id: 'playmaker', name: 'Playmaker', description: 'Vision and passing to create chances', type: 'positive' as const },
  { id: 'work_horse', name: 'Work Horse', description: 'Covers every blade of grass', type: 'positive' as const },
  { id: 'clinical_finisher', name: 'Clinical Finisher', description: 'Ruthless in front of goal', type: 'positive' as const },
  { id: 'team_player', name: 'Team Player', description: 'Always puts the team first', type: 'positive' as const },
  { id: 'early_crosser', name: 'Early Crosser', description: 'Delivers crosses before defenders settle', type: 'positive' as const },
  { id: 'flair', name: 'Flair', description: 'Attempts the unexpected', type: 'positive' as const },
  { id: 'outside_foot_shot', name: 'Outside Foot Shot', description: 'Can shoot with the outside of the boot', type: 'positive' as const },
  { id: 'driven_pass', name: 'Driven Pass', description: 'Can play low, hard passes through defenses', type: 'positive' as const },
  // Negative
  { id: 'injury_prone', name: 'Injury Prone', description: 'More susceptible to injuries', type: 'negative' as const },
  { id: 'hot_head', name: 'Hot Head', description: 'Prone to disciplinary issues', type: 'negative' as const },
  { id: 'diver', name: 'Diver', description: 'Goes down easily, referees notice', type: 'negative' as const },
  { id: 'selfish', name: 'Selfish', description: 'Takes shots instead of passing', type: 'negative' as const },
  { id: 'slow_learner', name: 'Slow Learner', description: 'Development is slower than normal', type: 'negative' as const },
  { id: 'inconsistent', name: 'Inconsistent', description: 'Performance varies wildly match to match', type: 'negative' as const },
  { id: 'lazy', name: 'Lazy', description: 'Does not track back or press', type: 'negative' as const },
  // Neutral / Situational
  { id: 'home_grown', name: 'Home Grown', description: 'Came through the academy', type: 'neutral' as const },
  { id: 'fan_favorite', name: 'Fan Favorite', description: 'Adored by supporters', type: 'neutral' as const },
  { id: 'mercurial', name: 'Mercurial', description: 'Unpredictable — brilliant one day, invisible the next', type: 'neutral' as const },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Thrives when the team is behind', type: 'neutral' as const },
  { id: 'big_game_player', name: 'Big Game Player', description: 'Raises performance in derbies and finals', type: 'positive' as const },
  { id: 'quiet_professional', name: 'Quiet Professional', description: 'Lets their football do the talking', type: 'neutral' as const },
] as const;

export type PlayerTraitType = 'positive' | 'negative' | 'neutral';

// -----------------------------------------------------------
// Name generation data by nationality
// -----------------------------------------------------------
const FIRST_NAMES_BY_NATIONALITY: Record<string, string[]> = {
  England: ['James', 'Harry', 'Jack', 'Oliver', 'Charlie', 'Thomas', 'George', 'William', 'Ethan', 'Alexander', 'Daniel', 'Marcus', 'Ben', 'Luke', 'Joe', 'Ryan', 'Aaron', 'Callum', 'Mason', 'Alfie'],
  Spain: ['Álvaro', 'Carlos', 'Diego', 'Fernando', 'Javier', 'Marc', 'Pedro', 'Sergio', 'Pablo', 'Miguel', 'Alejandro', 'Raúl', 'Iker', 'Gerard', 'Santi', 'Nico', 'Dani', 'Jorge', 'Hugo', 'Iván'],
  Italy: ['Marco', 'Lorenzo', 'Andrea', 'Matteo', 'Federico', 'Luca', 'Stefano', 'Alessandro', 'Gianluigi', 'Riccardo', 'Davide', 'Niccolò', 'Giacomo', 'Simone', 'Antonio', 'Fabio', 'Emanuele', 'Filippo', 'Giuseppe', 'Tommaso'],
  Germany: ['Lukas', 'Leon', 'Maximilian', 'Jonas', 'Felix', 'Tim', 'Kai', 'Julian', 'Niklas', 'Florian', 'Marcel', 'Denis', 'Bastian', 'Manuel', 'Toni', 'Kevin', 'Sven', 'Mario', 'Thomas', 'Christoph'],
  France: ['Antoine', 'Kylian', 'Ousmane', 'Raphaël', 'Hugo', 'Paul', 'Adrien', 'Matteo', 'Corentin', 'Lucas', 'Théo', 'Olivier', 'Nabil', 'Moussa', 'Dayot', 'Aurélien', 'Eduardo', 'Jules', 'Axel', 'Jean'],
  Brazil: ['Gabriel', 'Lucas', 'Vinícius', 'Raphinha', 'Bruno', 'Pedro', 'Neymar', 'Casemiro', 'Richarlison', 'Rodrygo', 'Fabinho', 'Arthur', 'Marquinhos', 'Danilo', 'Alex', 'Felipe', 'Thiago', 'Roberto', 'Eduardo', 'Rafael'],
  Argentina: ['Lionel', 'Paulo', 'Ángel', 'Emiliano', 'Lautaro', 'Julián', 'Nicolás', 'Rodrigo', 'Leandro', 'Alexis', 'Gonzalo', 'Federico', 'Matías', 'Martín', 'Diego', 'Fernando', 'Maximiliano', 'Eduardo', 'Marcos', 'Thiago'],
  Portugal: ['Cristiano', 'Bruno', 'Bernardo', 'Rúben', 'João', 'Diogo', 'Rafael', 'André', 'Gonçalo', 'Pedro', 'Vitinha', 'Nuno', 'Ricardo', 'Fábio', 'Renato', 'Danilo', 'Otávio', 'Nélson', 'Pepe', 'José'],
  Netherlands: ['Frenkie', 'Matthijs', 'Memphis', 'Cody', 'Virgil', 'Daley', 'Denzel', 'Stefan', 'Teun', 'Marten', 'Wout', 'Steven', 'Xavi', 'Jurriën', 'Jeremie', 'Nathan', 'Donny', 'Luuk', 'Donyell', 'Brian'],
  Belgium: ['Kevin', 'Romelu', 'Eden', 'Thibaut', 'Youri', 'Leander', 'Jeremy', 'Axel', 'Thomas', 'Jan', 'Toby', 'Mousa', 'Nacer', 'Divock', 'Dries', 'Thorgan', 'Charles', 'Amadou', 'Wout', 'Jason'],
  Croatia: ['Luka', 'Ivan', 'Marcelo', 'Mateo', 'Joško', 'Dominik', 'Andrej', 'Ante', 'Mario', 'Dejan', 'Josip', 'Marko', 'Bruno', 'Borna', 'Kristijan', 'Lovro', 'Filip', 'Nikola', 'Dario', 'Franko'],
  Uruguay: ['Luis', 'Edinson', 'Federico', 'Darwin', 'José', 'Rodrigo', 'Ronald', 'Sebastián', 'Matías', 'Diego', 'Nahitan', 'Maxi', 'Martín', 'Gastón', 'Agustín', 'Brian', 'Facundo', 'Jonathan', 'Nicolas', 'Santiago'],
  Colombia: ['James', 'Radamel', 'Duván', 'Juan', 'Luis', 'Yerry', 'Davinson', 'Jefferson', 'David', 'Miguel', 'Santiago', 'Johan', 'Daniel', 'Andrés', 'Carlos', 'Roger', 'Jhon', 'Frank', 'Alfredo', 'Gustavo'],
  Morocco: ['Achraf', 'Hakim', 'Sofyan', 'Noussair', 'Romain', 'Yassine', 'Nayef', 'Selim', 'Azzedine', 'Soufiane', 'Walid', 'Munir', 'Amine', 'Yahia', 'Zouheir', 'Medhi', 'Romain', 'Oussama', 'Bilal', 'Ilias'],
  Nigeria: ['Victor', 'Samuel', 'Wilfred', 'Alex', 'Calvin', 'Joe', 'Paul', 'Moses', 'Kelechi', 'Ahmed', 'William', 'Ola', 'Semi', 'Frank', 'Raphael', 'Peter', 'Emmanuel', 'Kenneth', 'Blessing', 'David'],
  Senegal: ['Sadio', 'Kalidou', 'Idrissa', 'Édouard', 'Boulaye', 'Papa', 'Moussa', 'Cheikhou', 'Ismaila', 'Fodé', 'Youssouf', 'Abdou', 'Mamadou', 'Pape', 'Aliou', 'Ousmane', 'Habib', 'Ibrahima', 'Modou', 'Mbaye'],
  'South Korea': ['Heung-Min', 'Min-Jae', 'Hwang', 'Lee', 'Kim', 'Son', 'Park', 'Jung', 'Cho', 'Oh', 'Kwon', 'Yoo', 'Seol', 'Ki', 'Hwang', 'Nam', 'Ko', 'Hong', 'Ahn', 'Cha'],
  Japan: ['Takefusa', 'Kaoru', 'Ritsu', 'Daichi', 'Wataru', 'Hiroki', 'Junya', 'Ao', 'Yuki', 'Reo', 'Maya', 'Takehiro', 'Ryo', 'Daizen', 'Shogo', 'Asano', 'Kamada', 'Endo', 'Mitoma', 'Kubo'],
  Mexico: ['Hirving', 'Raúl', 'Edson', 'Carlos', 'Héctor', 'Jesús', 'Diego', 'Javier', 'Giovani', 'Miguel', 'Andrés', 'Guillermo', 'Ochoa', 'Luis', 'Henry', 'Alex', 'Jorge', 'Rodolfo', 'César', 'Erick'],
  USA: ['Christian', 'Weston', 'Gio', 'Tim', 'Tyler', 'Antonee', 'Matt', 'Sergiño', 'Brenden', 'Yunus', 'Chris', 'Walker', 'DeAndre', 'Josh', 'Ricardo', 'Folarin', 'Malik', 'Caden', 'Haji', 'Paxton'],
  Scotland: ['Andrew', 'Scott', 'John', 'Kieran', 'Ryan', 'Callum', 'Liam', 'Lewis', 'Nathan', 'Stuart', 'Grant', 'David', 'James', 'Robert', 'Jack', 'Oliver', 'Aaron', 'Connor', 'Declan', 'Fraser'],
  Wales: ['Gareth', 'Aaron', 'Daniel', 'Joe', 'Harry', 'Ben', 'Neco', 'Ethan', 'Kieffer', 'Brennan', 'Connor', 'Chris', 'David', 'Tom', 'Rhys', 'Owen', 'Tyler', 'Sorba', 'Luke', 'Mark'],
  Ireland: ['Shane', 'James', 'Seamus', 'Matt', 'Callum', 'Conor', 'Josh', 'Adam', 'Dara', 'Cillian', 'Jason', 'Nathan', 'Jack', 'Liam', 'Mark', 'Kevin', 'Sean', 'Patrick', 'Declan', 'Ronan'],
  Poland: ['Robert', 'Piotr', 'Arkadiusz', 'Jan', 'Grzegorz', 'Kamil', 'Jakub', 'Mateusz', 'Krzysztof', 'Przemysław', 'Sebastian', 'Michał', 'Marcin', 'Tomasz', 'Adam', 'Łukasz', 'Wojciech', 'Bartosz', 'Karol', 'Dawid'],
  Serbia: ['Dušan', 'Aleksandar', 'Filip', 'Nemanja', 'Sergej', 'Lazar', 'Vlaho', 'Andrija', 'Strahinja', 'Miloš', 'Marko', 'Uroš', 'Nikola', 'Ivan', 'Svetozar', 'Mihajlo', 'Bogdan', 'Danilo', 'Matija', 'Vasilije'],
  Turkey: ['Hakan', 'Cengiz', 'Çağlar', 'Merih', 'Burak', 'Orkun', 'Enes', 'Yusuf', 'Kerem', 'Arda', 'Ferdi', 'İrfan', 'Cengiz', 'Umut', 'Dorukhan', 'Efecan', 'Barış', 'Oğuz', 'Serdar', 'Emre'],
  Sweden: ['Alexander', 'Dejan', 'Viktor', 'Emil', 'Robin', 'Karl', 'Ludvig', 'Filip', 'Mattias', 'Kristoffer', 'Sebastian', 'Oscar', 'Isak', 'Andreas', 'Jens', 'Gustav', 'Anton', 'Elias', 'Linus', 'Joel'],
  Norway: ['Erling', 'Martin', 'Sander', 'Stefan', 'Kristoffer', 'Mohamed', 'Odegaard', 'Joshua', 'Leo', 'Fredrik', 'Mats', 'Håvard', 'Ståle', 'Marcus', 'Andreas', 'Julian', 'Tobias', 'Patrick', 'Simen', 'Ola'],
  Denmark: ['Christian', 'Pierre-Emile', 'Simon', 'Andreas', 'Rasmus', 'Joakim', 'Mikkel', 'Kasper', 'Mathias', 'Jens', 'Victor', 'Daniel', 'Anders', 'Oliver', 'Lucas', 'Frederik', 'Nicolas', 'Elias', 'Gustav', 'Lasse'],
  Switzerland: ['Granit', 'Xherdan', 'Manuel', 'Ricardo', 'Yann', 'Fabian', 'Haris', 'Denis', 'Steven', 'Nico', 'Breel', 'Remo', 'Jordan', 'Silvan', 'Kevin', 'Michi', 'Cedric', 'Renato', 'Alain', 'Joel'],
  Austria: ['David', 'Marcel', 'Konrad', 'Marko', 'Stefan', 'Sasa', 'Xaver', 'Valentino', 'Philipp', 'Maximilian', 'Florian', 'Christoph', 'Martin', 'Andreas', 'Stefan', 'Kevin', 'Daniel', 'Marco', 'Patrick', 'Lukas'],
  'Czech Republic': ['Patrik', 'Vladimír', 'Tomáš', 'Petr', 'Adam', 'Jakub', 'Martin', 'Lukáš', 'David', 'Ondřej', 'Jan', 'Josef', 'Milan', 'Karel', 'Matěj', 'Filip', 'Radek', 'Marek', 'Václav', 'Roman'],
  Ghana: ['Mohammed', 'Thomas', 'Jordan', 'André', 'Asamoah', 'Daniel', 'John', 'Christian', 'Kamaldeen', 'Inaki', 'Alexander', 'Mubarak', 'Abdul', 'Emmanuel', 'Kwame', 'Kofi', 'Yaw', 'Kwabena', 'Ernest', 'Samuel'],
  Cameroon: ['Samuel', 'Vincent', 'Eric', 'André', 'Karl', 'Joel', 'Jean', 'Nicolas', 'Franck', 'Rigobert', 'Patrick', 'Alain', 'Claudio', 'Stephane', 'Georges', 'Yvan', 'Bryan', 'Kunde', 'Moumi', 'Lea'],
  'Ivory Coast': ['Didier', 'Yaya', 'Kolo', 'Gervinho', 'Wilfried', 'Serge', 'Nicolas', 'Kessié', 'Bailly', 'Aurier', 'Zaha', 'Pepe', 'Cornet', 'Boga', 'Kolo', 'Franck', 'Salomon', 'Steve', 'Odilon', 'Ibrahim'],
  Chile: ['Alexis', 'Arturo', 'Gary', 'Claudio', 'Mauricio', 'Eduardo', 'Charles', 'Ben', 'Jean', 'Marcelo', 'Francisco', 'Sebastián', 'Nicolás', 'Matías', 'Diego', 'Pablo', 'Humberto', 'Jorge', 'Mark', 'Felipe'],
  Ecuador: ['Enner', 'Antonio', 'Pervis', 'Moisés', 'Gonzalo', 'Ángel', 'Sebastián', 'Félix', 'Jackson', 'Michael', 'Estupiñán', 'Hincapié', 'Caicedo', 'Valencia', 'Preciado', 'Arboleda', 'Domínguez', 'Torres', 'Palacios', 'Ramírez'],
  Australia: ['Mathew', 'Aaron', 'Harry', 'Jackson', 'Ajdin', 'Cameron', 'Riley', 'Kye', 'Awer', 'Jamie', 'Mitchell', 'Thomas', 'Bailey', 'Jordan', 'Daniel', 'Adam', 'Alex', 'Ryan', 'Brandon', 'Nathaniel'],
  Canada: ['Alphonso', 'Jonathan', 'Cyle', 'Tajon', 'Alistair', 'Sam', 'Liam', 'Richie', 'Dayne', 'Stephen', 'Zachary', 'Mark', 'Lucas', 'Ayo', 'Kyle', 'Milan', 'Ismaël', 'Derek', 'Tyler', 'Jacob'],
  Ukraine: ['Andriy', 'Oleksandr', 'Viktor', 'Ruslan', 'Mykhaylo', 'Artem', 'Serhiy', 'Yevhen', 'Vitaliy', 'Oleh', 'Taras', 'Dmytro', 'Bohdan', 'Ihor', 'Maksym', 'Denys', 'Roman', 'Volodymyr', 'Anatoliy', 'Pavlo'],
};

const LAST_NAMES_BY_NATIONALITY: Record<string, string[]> = {
  England: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Thompson', 'Robinson', 'White', 'Hall', 'Green', 'Harris', 'Martin', 'Clarke'],
  Spain: ['García', 'Rodríguez', 'Martínez', 'López', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Herrera', 'Morales', 'Jiménez', 'Ruiz', 'Álvarez', 'Mendoza', 'Castillo', 'Romero', 'González'],
  Italy: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti'],
  Germany: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Klein', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Krüger', 'Hartmann'],
  France: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'Girard', 'Roux', 'Fournier', 'Morel', 'Blanc'],
  Brazil: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Araújo', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Vieira', 'Mendes'],
  Argentina: ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Díaz', 'García', 'Pérez', 'Romero', 'Sánchez', 'Torres', 'Ramírez', 'Flores', 'Acosta', 'Medina', 'Herrera', 'Castro', 'Álvarez', 'Ruiz', 'Moreno'],
  Portugal: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Martins', 'Rodrigues', 'Sousa', 'Fernandes', 'Gonçalves', 'Almeida', 'Ribeiro', 'Carvalho', 'Lopes', 'Moreira', 'Nunes', 'Mendes', 'Vieira', 'Tavares'],
  Netherlands: ['de Jong', 'van Dijk', 'Jansen', 'de Vries', 'van der Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Peters', 'Mulder', 'Jong', 'Hendriks', 'van den Berg', 'Dekker', 'Brouwer', 'Bos', 'Vos', 'de Groot'],
  Belgium: ['Peeters', 'Janssen', 'Maes', 'Jacobs', 'Willems', 'Mertens', 'Claes', 'Goossens', 'Wouters', 'De Smet', 'Lambrechts', 'Van Damme', 'Dubois', 'Lambert', 'Martin', 'Bernard', 'Herman', 'Desmet', 'Lefebvre', 'Renaux'],
  Croatia: ['Horvat', 'Kovačević', 'Babić', 'Marić', 'Jurić', 'Novak', 'Knežević', 'Vuković', 'Matić', 'Tomić', 'Perić', 'Petrović', 'Kovačić', 'Janković', 'Ivić', 'Šarić', 'Popović', 'Pavić', 'Filipović', 'Barić'],
  Uruguay: ['Suárez', 'González', 'Rodríguez', 'Fernández', 'Martínez', 'López', 'Pérez', 'García', 'Sánchez', 'Romero', 'Torres', 'Ramírez', 'Flores', 'Acosta', 'Díaz', 'Herrera', 'Castro', 'Álvarez', 'Ruiz', 'Moreno'],
  Colombia: ['Rodríguez', 'García', 'Martínez', 'López', 'González', 'Hernández', 'Díaz', 'Torres', 'Ramírez', 'Flores', 'Sánchez', 'Morales', 'Ortiz', 'Vargas', 'Castro', 'Herrera', 'Rojas', 'Arias', 'Muñoz', 'Restrepo'],
  Morocco: ['El Amrani', 'Benali', 'Tazi', 'Berrada', 'Cherkaoui', 'El Fassi', 'Bennani', 'Alaoui', 'El Mansouri', 'Idrissi', 'Bouzidi', 'Lahlou', 'El Idrissi', 'Ziani', 'Amrani', 'Benjelloun', 'El Ouafi', 'Kettani', 'Senhaji', 'Filali'],
  Nigeria: ['Okafor', 'Eze', 'Okonkwo', 'Adeyemi', 'Balogun', 'Iheanacho', 'Ndidi', 'Iwobi', 'Aribo', 'Osimhen', 'Chukwu', 'Obi', 'Nwankwo', 'Uche', 'Adebayor', 'Oliseh', 'Amokachi', 'Ekong', 'Aina', 'Moffi'],
  Senegal: ['Mané', 'Kouyaté', 'Diop', 'Ndiaye', 'Sow', 'Dia', 'Fall', 'Ba', 'Sy', 'Sarr', 'Diallo', 'Gueye', 'Faye', 'Mbaye', 'Cissé', 'Thiam', 'Seck', 'Diagne', 'Niang', 'Sène'],
  'South Korea': ['Son', 'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Cho', 'Hwang', 'Oh', 'Kwon', 'Yoo', 'Seol', 'Ki', 'Nam', 'Ko', 'Hong', 'Ahn', 'Cha', 'Min', 'Shin'],
  Japan: ['Kubo', 'Mitoma', 'Endo', 'Kamada', 'Maeda', 'Ito', 'Tanaka', 'Sakai', 'Nakamura', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Sato', 'Kobayashi', 'Kato', 'Yoshida', 'Yamashita', 'Fujimoto'],
  Mexico: ['Hernández', 'González', 'López', 'Martínez', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales', 'Jiménez', 'Ruiz', 'Álvarez', 'Romero', 'Mendoza', 'Castillo'],
  USA: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'García', 'Miller', 'Davis', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'],
  Scotland: ['MacDonald', 'Campbell', 'Stewart', 'Murray', 'Robertson', 'Thomson', 'Anderson', 'Scott', 'Morrison', 'Clark', 'Paterson', 'Young', 'Watson', 'Mitchell', 'Fraser', 'Reid', 'Cameron', 'Henderson', 'Ross', 'Cunningham'],
  Wales: ['Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths', 'Owen', 'Price', 'Rees', 'Morris', 'Phillips', 'Edwards', 'Powell', 'Parry', 'Jenkins', 'Lloyd'],
  Ireland: ['Murphy', 'Kelly', 'O\'Sullivan', 'Walsh', 'Smith', 'O\'Brien', 'Byrne', 'Ryan', 'O\'Connor', 'O\'Neill', 'O\'Reilly', 'Doyle', 'McCarthy', 'Gallagher', 'Kavanagh', 'Lynch', 'Dunne', 'Fitzgerald', 'Murray', 'Nolan'],
  Poland: ['Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Pawlak', 'Grabowski', 'Nowak', 'Piotrowski', 'Krawczyk', 'Wrona', 'Jabłoński', 'Król', 'Mazurek', 'Szewczyk'],
  Serbia: ['Mitić', 'Petrović', 'Jovanović', 'Nikolić', 'Stefanović', 'Ilić', 'Marković', 'Đorđević', 'Pavlović', 'Stanković', 'Todorović', 'Milenković', 'Kovačević', 'Popović', 'Janković', 'Ristić', 'Lazarević', 'Filipović', 'Tomović', 'Živković'],
  Turkey: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek'],
  Sweden: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Berg', 'Lindberg', 'Jakobsson', 'Magnusson', 'Lindqvist', 'Axelsson'],
  Norway: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen', 'Johnsen', 'Mikkelsen', 'Eriksen', 'Berg', 'Lund', 'Holm', 'Sørensen', 'Haugen', 'Løkken', 'Dahl'],
  Denmark: ['Jensen', 'Nielsen', 'Hansen', 'Andersen', 'Pedersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Madsen', 'Andreasen', 'Mikkelsen', 'Thomsen', 'Poulsen', 'Johansen', 'Mortensen', 'Kristensen', 'Olsen', 'Frederiksen'],
  Switzerland: ['Müller', 'Meier', 'Schmid', 'Weber', 'Schneider', 'Fischer', 'Brunner', 'Bächi', 'Widmer', 'Zürcher', 'Frei', 'Huber', 'Keller', 'Herzog', 'Graf', 'Studer', 'Aebi', 'Bolliger', 'Egli', 'Fehr'],
  Austria: ['Gruber', 'Huber', 'Bauer', 'Wagner', 'Müller', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer', 'Lehner', 'Schmid', 'Auer', 'Lang', 'Winkler', 'Berger', 'Fuchs', 'Eder', 'Schwarz', 'Reiter'],
  'Czech Republic': ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný', 'Marek', 'Pospíšil', 'Hájek', 'Jelínek', 'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček'],
  Ghana: ['Mensah', 'Osei', 'Boateng', 'Appiah', 'Asante', 'Owusu', 'Amoah', 'Adjei', 'Danso', 'Agyeman', 'Ofori', 'Antwi', 'Tetteh', 'Adjei', 'Kwame', 'Acheampong', 'Bediako', 'Akufo', 'Darko', 'Frimpong'],
  Cameroon: ['Eto\'o', 'Nkoulou', 'Choupo-Moting', 'Aboubakar', 'Foe', 'Song', 'Mbia', 'Someni', 'N\'Jie', 'Zoa', 'Ndo', 'Ekambi', 'Kunde', 'Moumi', 'Toko', 'Angoua', 'Oyongo', 'Lea', 'Bassogog', 'Siani'],
  'Ivory Coast': ['Drogba', 'Touré', 'Zokora', 'Gervinho', 'Bony', 'Kolo', 'Aurier', 'Kessié', 'Pepe', 'Cornet', 'Zaha', 'Boga', 'Gradel', 'Seri', 'Diabate', 'Kalou', 'Sio', 'Doumbia', 'Traoré', 'Koné'],
  Chile: ['Sánchez', 'Vidal', 'Medel', 'Bravo', 'Isla', 'Beausejour', 'Jara', 'Aránguiz', 'Pulgar', 'Vargas', 'Jiménez', 'Mena', 'Maripán', 'Sierralta', 'López', 'Rojas', 'Valdivia', 'Pizarro', 'Suazo', 'Herrera'],
  Ecuador: ['Valencia', 'Preciado', 'Estupiñán', 'Hincapié', 'Caicedo', 'Arboleda', 'Domínguez', 'Torres', 'Ramírez', 'Zapata', 'Ayoví', 'Méndez', 'Plata', 'Rodríguez', 'Gruezo', 'Mena', 'Angulo', 'Martínez', 'Estrada', 'Almendra'],
  Australia: ['Ryan', 'Leckie', 'Sainsbury', 'Behich', 'Irvine', 'Hrustic', 'Mabil', 'Duke', 'McGree', 'Goodwin', 'Kuol', 'Bos', 'Atkinson', 'King', 'Degenek', 'Wright', 'Grant', 'Jones', 'Williams', 'Cox'],
  Canada: ['Davies', 'David', 'Larin', 'Buchanan', 'Johnston', 'Eustáquio', 'Adekugbe', 'Hutchinson', 'Bordeaux', 'Millar', 'Cavallini', 'Osorio', 'Piette', 'Laryea', 'Henry', 'Cornelius', 'Vitoria', 'Waterman', 'Utoikamanu', 'Kaye'],
  Ukraine: ['Shevchenko', 'Zinchenko', 'Mudryk', 'Yarmolenko', 'Tsygankov', 'Zubkov', 'Sudakov', 'Shaparenko', 'Bondarenko', 'Kovalenko', 'Kryvtsov', 'Matviyenko', 'Karavaev', 'Mykolenko', 'Tymchyk', 'Zabarnyi', 'Bondar', 'Bolbat', 'Shved', 'Yaremchuk'],
};

// -----------------------------------------------------------
// Generate a realistic player name by nationality
// -----------------------------------------------------------
export function generatePlayerName(nationality: string): { firstName: string; lastName: string } {
  const firstNames = FIRST_NAMES_BY_NATIONALITY[nationality] ?? FIRST_NAMES_BY_NATIONALITY['England'];
  const lastNames = LAST_NAMES_BY_NATIONALITY[nationality] ?? LAST_NAMES_BY_NATIONALITY['England'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { firstName, lastName };
}

// -----------------------------------------------------------
// Generate initial attributes for a player
// Based on position and potential, starting as a 14-year-old
// -----------------------------------------------------------
export function generateInitialAttributes(
  position: Position,
  age: number,
  potential: number
): PlayerAttributes {
  // Base values for a young player - lower than peak
  const youthBase = 20 + Math.floor(potential * 0.2);
  const positionWeights = POSITION_WEIGHTS[position];

  // Generate each attribute with some randomness
  const randomAttribute = (key: keyof PlayerAttributes): number => {
    const weight = positionWeights[key] ?? 0.1;
    // Higher weight = attribute starts higher relative to potential
    const base = youthBase + Math.floor(weight * potential * 0.3);
    const variance = Math.floor(Math.random() * 15) - 7; // ±7 variance
    return Math.max(5, Math.min(99, base + variance));
  };

  const attrs: PlayerAttributes = {
    pace: randomAttribute('pace'),
    shooting: randomAttribute('shooting'),
    passing: randomAttribute('passing'),
    dribbling: randomAttribute('dribbling'),
    defending: randomAttribute('defending'),
    physical: randomAttribute('physical'),
  };

  // Add GK-specific attributes if goalkeeper
  if (position === 'GK') {
    attrs.diving = randomAttribute('diving');
    attrs.handling = randomAttribute('handling');
    attrs.positioning = randomAttribute('positioning');
    attrs.reflexes = randomAttribute('reflexes');
  }

  // Age adjustment: older players have slightly better attributes
  if (age > 14) {
    const ageBonus = Math.floor((age - 14) * 1.5);
    (Object.keys(attrs) as (keyof PlayerAttributes)[]).forEach(key => {
      const val = attrs[key];
      if (val !== undefined) {
        const weight = positionWeights[key] ?? 0.1;
        attrs[key] = Math.min(99, val + Math.floor(ageBonus * weight * 2));
      }
    });
  }

  return attrs;
}

// -----------------------------------------------------------
// Calculate overall rating from attributes using position weights
// -----------------------------------------------------------
export function calculateOverall(attributes: PlayerAttributes, position: Position): number {
  const weights = POSITION_WEIGHTS[position];
  let totalWeight = 0;
  let weightedSum = 0;

  (Object.keys(weights) as (keyof PlayerAttributes)[]).forEach(key => {
    const weight = weights[key];
    const value = attributes[key];
    if (value !== undefined && weight > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return 50; // fallback
  return Math.round(weightedSum / totalWeight);
}

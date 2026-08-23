export interface SyllabusTopic {
  id: string;
  title: string;
  subtopics?: string[];
}

export interface SyllabusSubject {
  id: string;
  name: string;
  paper: string; // GS1, GS2, GS3, GS4
  topics: SyllabusTopic[];
}

export const UPSC_SYLLABUS: SyllabusSubject[] = [
  {
    id: 'history_art',
    name: 'Indian Heritage, History & Culture',
    paper: 'GS1',
    topics: [
      {
        id: 'art_culture',
        title: 'Indian Art & Architecture',
        subtopics: ['Ancient Architecture & Temples', 'Sculpture & Coinage', 'Performative Arts & Dances', 'Paintings & Literature', 'UNESCO World Heritage Sites']
      },
      {
        id: 'modern_history',
        title: 'Modern Indian History (1757-1947)',
        subtopics: ['British Expansion & Policies', 'Revolt of 1857 & Early Resistance', 'Social & Religious Reform Movements', 'Freedom Struggle & Gandhian Era', 'Partition & Independence']
      },
      {
        id: 'post_independence',
        title: 'Post-Independence Consolidation',
        subtopics: ['Reorganisation of States', 'Integration of Princely States', 'Indo-Pak & Indo-China Wars', 'Emergency & Political Evolution', 'Linguistic Reorganisation']
      },
      {
        id: 'world_history',
        title: 'World History (18th Century Onwards)',
        subtopics: ['Industrial Revolution', 'World Wars I & II', 'Redraw of National Boundaries', 'Decolonisation & Cold War', 'Capitalism, Socialism, Communism']
      }
    ]
  },
  {
    id: 'society',
    name: 'Indian Society',
    paper: 'GS1',
    topics: [
      {
        id: 'social_structure',
        title: 'Salient Features of Indian Society',
        subtopics: ['Diversity of India', 'Role of Women & Women’s Organisations', 'Population & Associated Issues', 'Poverty & Developmental Issues']
      },
      {
        id: 'urbanisation',
        title: 'Urbanisation & Social Changes',
        subtopics: ['Urbanisation Problems & Remedies', 'Effects of Globalisation on Indian Society', 'Social Empowerment', 'Communalism, Regionalism & Secularism']
      }
    ]
  },
  {
    id: 'geography',
    name: 'Physical & Human Geography',
    paper: 'GS1',
    topics: [
      {
        id: 'physical_geography',
        title: 'Salient Features of World Physical Geography',
        subtopics: ['Geomorphology & Plate Tectonics', 'Climatology & Monsoons', 'Oceanography & Currents', 'Earthquakes, Tsunamis & Volcanoes']
      },
      {
        id: 'resource_distribution',
        title: 'Distribution of Key Natural Resources',
        subtopics: ['South Asia & Indian Subcontinent', 'Primary, Secondary & Tertiary Sector Industries', 'Factors for Location of Industries']
      }
    ]
  },
  {
    id: 'polity_constitution',
    name: 'Polity & Indian Constitution',
    paper: 'GS2',
    topics: [
      {
        id: 'basic_structure',
        title: 'Indian Constitution & Basic Structure',
        subtopics: ['Historical Underpinnings & Evolution', 'Preamble & Fundamental Rights', 'Directive Principles & Fundamental Duties', 'Amendments & Basic Structure Doctrine']
      },
      {
        id: 'federalism',
        title: 'Functions & Responsibilities of Union and States',
        subtopics: ['Federal Structure & Devolution of Powers', 'Centre-State Relations & Inter-State Council', 'Emergency Provisions', 'Local Governance & 73rd/74th Amendments']
      },
      {
        id: 'judiciary_executive',
        title: 'Structure & Working of Judiciary & Executive',
        subtopics: ['Supreme Court & High Courts', 'Judicial Review & PIL', 'President, PM & Cabinet System', 'Parliamentary Committees & Business Rules']
      },
      {
        id: 'bodies',
        title: 'Constitutional & Statutory Bodies',
        subtopics: ['Election Commission & Finance Commission', 'UPSC & CAG', 'NHRC, CVC & Lokpal', 'NITI Aayog & Regulatory Authorities']
      }
    ]
  },
  {
    id: 'governance',
    name: 'Governance & Social Justice',
    paper: 'GS2',
    topics: [
      {
        id: 'e_governance',
        title: 'Governance, Transparency & Accountability',
        subtopics: ['E-Governance Applications & Models', 'Citizens Charters & RTI Act', 'Civil Services in a Democracy', 'Role of NGOs & SHGs']
      },
      {
        id: 'welfare_schemes',
        title: 'Welfare Schemes for Vulnerable Sections',
        subtopics: ['SC/ST, OBC, Minorities & Women Schemes', 'Healthcare, Education & Human Resources', 'Issues Relating to Poverty & Hunger']
      }
    ]
  },
  {
    id: 'international_relations',
    name: 'International Relations',
    paper: 'GS2',
    topics: [
      {
        id: 'neighborhood',
        title: 'India & Its Neighborhood',
        subtopics: ['India-Pakistan & Kashmir Issue', 'India-China Border & Economic Ties', 'India-Nepal, Bangladesh, Sri Lanka', 'Act East & SAGAR Policy']
      },
      {
        id: 'global_groupings',
        title: 'Bilateral, Regional & Global Groupings',
        subtopics: ['QUAD, BRICS, SCO, G20', 'UN, WTO, IMF & World Bank Reforms', 'Indian Diaspora & Soft Power']
      }
    ]
  },
  {
    id: 'economy',
    name: 'Indian Economy & Development',
    paper: 'GS3',
    topics: [
      {
        id: 'growth_planning',
        title: 'Indian Economy & Issues Relating to Planning',
        subtopics: ['Mobilisation of Resources & Growth', 'Inclusive Growth & Employment', 'Government Budgeting & Fiscal Policy', 'GST & Tax Reforms']
      },
      {
        id: 'agriculture',
        title: 'Agriculture & Food Processing',
        subtopics: ['Major Crops & Irrigation Patterns', 'MSP, Subsidies & PDS System', 'Land Reforms in India', 'Food Processing Industries']
      },
      {
        id: 'infrastructure',
        title: 'Infrastructure & Investment Models',
        subtopics: ['Energy, Ports, Roads, Airports', 'Railways Modernisation', 'PPP Models & National Infrastructure Pipeline']
      }
    ]
  },
  {
    id: 'science_environment',
    name: 'Science, Tech & Environment',
    paper: 'GS3',
    topics: [
      {
        id: 'sci_tech',
        title: 'Science & Technology Developments',
        subtopics: ['Indigenisation of Technology', 'IT, Space, Computers & Robotics', 'Nano-technology & Bio-technology', 'IPR Issues']
      },
      {
        id: 'environment',
        title: 'Conservation & Environmental Pollution',
        subtopics: ['Climate Change & COP Summits', 'Biodiversity & National Parks', 'EIA (Environmental Impact Assessment)', 'Disaster Management & Sendai Framework']
      },
      {
        id: 'security',
        title: 'Internal Security & Cyber Security',
        subtopics: ['Linkages of Extremism & Development', 'Internal Security Challenges via Communication Networks', 'Basics of Cyber Security & Money Laundering', 'Border Areas Security & Management']
      }
    ]
  },
  {
    id: 'ethics',
    name: 'Ethics, Integrity & Aptitude',
    paper: 'GS4',
    topics: [
      {
        id: 'ethics_human',
        title: 'Ethics and Human Interface',
        subtopics: ['Essence, Determinants & Consequences of Ethics', 'Human Values & Lessons from Great Leaders', 'Attitude: Content, Structure, Function']
      },
      {
        id: 'probity_governance',
        title: 'Probity in Governance & Case Studies',
        subtopics: ['Public Service Values & Philosophical Basis', 'Codes of Conduct & Work Culture', 'Challenges of Corruption', 'Case Studies on Ethical Dilemmas']
      }
    ]
  }
];

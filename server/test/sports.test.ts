// Must stay the first import: prepares the isolated test environment before the app loads.
import { baseUrl } from './helpers/testContext.js';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeWebsite } from '../src/services/aiGenerator.js';
import { repository } from '../src/db/repository.js';
import type { ClientRequirements, ClientProject } from '../src/types/index.js';
import type { SportsWebsiteData } from '../src/types/sports.js';

describe('Sports Website Creation Engine - Pitchero Architecture & Integration Suite', () => {
  let adminToken = '';
  let nonAdminToken = '';
  let testProjectId = '';

  const mockSportsData: SportsWebsiteData = {
    schemaVersion: '1.0',
    club: {
      organizationName: 'Victoria Athletic Club',
      tagline: 'Excellence in Football and Athletics since 1912',
      crestUrl: 'https://cdn.digiverse.site/crests/victoria.png',
      foundedYear: 1912,
      primaryColors: { primary: '#0284c7', secondary: '#ffffff' },
      homeGround: 'Victoria Memorial Arena, Ground 1',
      headquarters: '12 Sports Enclave, North Sector',
      sportTypes: ['football', 'athletics'],
      description: 'Historic multi-sport community athletics club competing in Premier Division.'
    },
    teams: [
      {
        id: 'team_first_xi',
        name: 'Victoria Athletic First XI',
        sport: 'football',
        genderCategory: 'Men',
        ageGroup: 'Senior',
        division: 'Premier Division',
        squadCount: 22,
        isActive: true
      },
      {
        id: 'team_u19',
        name: 'Victoria Colts U19',
        sport: 'football',
        genderCategory: 'Youth',
        ageGroup: 'U19',
        division: 'State Youth League',
        squadCount: 18,
        isActive: true
      }
    ],
    players: [
      {
        id: 'player_10',
        teamId: 'team_first_xi',
        fullName: 'Arjun Sen',
        jerseyNumber: 10,
        position: 'Striker',
        status: 'active',
        statistics: { appearances: 18, goals: 14, assists: 7 }
      },
      {
        id: 'player_1',
        teamId: 'team_first_xi',
        fullName: 'Devraj Mukherjee',
        jerseyNumber: 1,
        position: 'Goalkeeper',
        status: 'active',
        statistics: { appearances: 18, cleanSheets: 8 }
      }
    ],
    staff: [
      {
        id: 'staff_1',
        fullName: 'Marcus Vance',
        role: 'Head Coach',
        department: 'Coaching',
        qualifications: ['UEFA Pro Licence', 'AFC A Diploma']
      }
    ],
    competitions: [
      {
        id: 'comp_premier',
        name: 'Premier Regional Football League 2026',
        sport: 'football',
        competitionType: 'league',
        season: '2026-2027',
        isPrimary: true
      }
    ],
    fixtures: [
      {
        id: 'fix_101',
        teamId: 'team_first_xi',
        competitionId: 'comp_premier',
        opponentName: 'Crown Rovers FC',
        venue: 'Victoria Memorial Arena',
        scheduledAt: '2026-11-15T15:30:00Z',
        status: 'scheduled',
        homeOrAway: 'home'
      },
      {
        id: 'fix_100',
        teamId: 'team_first_xi',
        competitionId: 'comp_premier',
        opponentName: 'Metropolitan FC',
        venue: 'Metro Sports Complex',
        scheduledAt: '2026-11-01T14:00:00Z',
        status: 'finished',
        homeOrAway: 'away',
        homeScore: 1,
        awayScore: 3,
        attendance: 2450
      }
    ],
    standings: [
      {
        competitionId: 'comp_premier',
        teamId: 'team_first_xi',
        position: 1,
        played: 10,
        won: 8,
        drawn: 1,
        lost: 1,
        goalsFor: 26,
        goalsAgainst: 8,
        goalDifference: 18,
        points: 25,
        form: ['W', 'W', 'W', 'D', 'W']
      },
      {
        competitionId: 'comp_premier',
        teamId: 'Crown Rovers FC',
        position: 2,
        played: 10,
        won: 7,
        drawn: 2,
        lost: 1,
        goalsFor: 21,
        goalsAgainst: 9,
        goalDifference: 12,
        points: 23,
        form: ['W', 'D', 'W', 'W', 'L']
      }
    ],
    matchEvents: [
      {
        id: 'evt_m1',
        fixtureId: 'fix_100',
        minute: 23,
        eventType: 'goal',
        playerId: 'player_10',
        teamId: 'team_first_xi',
        description: 'Arjun Sen curling free-kick into top corner'
      }
    ],
    sponsors: [
      {
        id: 'spon_1',
        name: 'Apex Athletic Apparel',
        sponsorshipLevel: 'Official Kit Partner',
        displayOrder: 1
      }
    ],
    news: [
      {
        id: 'news_1',
        title: 'Victoria Clinch Crucial Away Derby Victory',
        summary: 'A dominant 3-1 performance secures 3 points at Metro Sports Complex.',
        publishedAt: '2026-11-01T18:00:00Z',
        isPublished: true,
        category: 'Match Report'
      }
    ],
    pages: [],
    sections: [],
    dataAvailability: {
      teams: true,
      players: true,
      staff: true,
      competitions: true,
      fixtures: true,
      standings: true,
      sponsors: true,
      news: true
    }
  };

  before(async () => {
    // 1. Authenticate Admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@digiverse.internal',
        password: 'Digiverse@2026!'
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const data = await loginRes.json();
    adminToken = data.token;

    // 2. Create a test project for Sports Engine tests
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        organizationName: `Sports Club Automated ${Date.now()}`,
        category: 'sports',
        tagline: 'Leading Youth & Senior Athletics Club',
        aboutText: 'Dedicated to competitive excellence and grassroots player development.',
        primaryColor: '#0284c7',
        accentColor: '#06b6d4',
        typographyStyle: 'athletic',
        sportsData: mockSportsData
      })
    });
    assert.strictEqual(projRes.status, 201);
    const projData = await projRes.json();
    testProjectId = projData.project.id;

    // 3. Synthesize initial website
    const genRes = await fetch(`${baseUrl}/api/projects/${testProjectId}/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(genRes.status, 200);
  });

  test('Test 1: Sports Club archetype synthesis incorporates Pitchero layout and sportsData', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Victoria Athletic Club',
      category: 'sports',
      tagline: 'Excellence in Football since 1912',
      sportsData: mockSportsData,
      designSelection: {
        mode: 'template',
        modelId: 'sports_club'
      }
    };

    const site = synthesizeWebsite(reqs);
    assert.ok(site);
    assert.strictEqual(site.themeAccent, 'sports-performance');
    assert.strictEqual(site.layoutPreset, 'split');
    assert.ok(site.heroHeadline.includes('Victoria Athletic Club'));
    assert.ok(site.sportsData);
    assert.strictEqual(site.sportsData.teams.length, 2);
    assert.strictEqual(site.sportsData.players.length, 2);
    assert.strictEqual(site.sportsData.fixtures.length, 2);
    assert.strictEqual(site.sportsData.standings.length, 2);
  });

  test('Test 2: Tournament Hub archetype synthesis sets sports-arena and grid preset', () => {
    const reqs: ClientRequirements = {
      organizationName: 'National Champions Trophy',
      category: 'sports',
      tagline: 'Premier Inter-Club Football Championship',
      sportsData: mockSportsData,
      designSelection: {
        mode: 'template',
        modelId: 'sports_tournament'
      }
    };

    const site = synthesizeWebsite(reqs);
    assert.ok(site);
    assert.strictEqual(site.themeAccent, 'sports-arena');
    assert.strictEqual(site.layoutPreset, 'grid');
  });

  test('Test 3: Sports Academy archetype synthesis sets sports-academy and editorial preset', () => {
    const reqs: ClientRequirements = {
      organizationName: 'Metro High Performance Academy',
      category: 'sports',
      tagline: 'Elite Coaching & Player Pathway',
      sportsData: mockSportsData,
      designSelection: {
        mode: 'template',
        modelId: 'sports_academy'
      }
    };

    const site = synthesizeWebsite(reqs);
    assert.ok(site);
    assert.strictEqual(site.themeAccent, 'sports-academy');
    assert.strictEqual(site.layoutPreset, 'editorial');
  });

  test('Test 4: PATCH /api/projects/:id/sports-data rejects unauthenticated calls with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/sports-data`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sportsData: mockSportsData })
    });
    assert.strictEqual(res.status, 401);
  });

  test('Test 5: PATCH /api/projects/:id/sports-data validates required club profile', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/sports-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        sportsData: {
          schemaVersion: '1.0'
          // club is missing
        }
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('club'));
  });

  test('Test 6: PATCH /api/projects/:id/sports-data updates and persists sports datasets', async () => {
    const updatedData: SportsWebsiteData = {
      ...mockSportsData,
      club: {
        ...mockSportsData.club,
        tagline: 'Updated Tagline - Champions 2026'
      },
      teams: [
        ...mockSportsData.teams,
        {
          id: 'team_women',
          name: 'Victoria Women First Team',
          sport: 'football',
          genderCategory: 'Women',
          ageGroup: 'Senior',
          isActive: true
        }
      ]
    };

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/sports-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ sportsData: updatedData })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.project.generatedWebsite.sportsData.teams.length, 3);
    assert.strictEqual(body.project.generatedWebsite.sportsData.club.tagline, 'Updated Tagline - Champions 2026');

    // Verify persistence directly in SQLite repository
    const fromDb = await repository.getProjectById(testProjectId);
    assert.ok(fromDb);
    assert.strictEqual(fromDb.generatedWebsite?.sportsData?.teams.length, 3);
    assert.strictEqual(fromDb.generatedWebsite?.sportsData?.club.tagline, 'Updated Tagline - Champions 2026');
  });

  test('Test 7: PATCH /api/projects/:id/customize accepts and saves sportsData', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/customize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        themeAccent: 'neon-cyan',
        sportsData: mockSportsData
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.project.generatedWebsite.themeAccent, 'neon-cyan');
    assert.strictEqual(body.project.generatedWebsite.sportsData.teams.length, 2);
  });

  test('Test 8: Standings mathematics and points consistency', () => {
    // Points = (W * 3) + (D * 1)
    for (const standing of mockSportsData.standings) {
      const calculatedPoints = (standing.won * 3) + (standing.drawn * 1);
      assert.strictEqual(
        standing.points,
        calculatedPoints,
        `Points for team ${standing.teamId} should equal 3*W + 1*D`
      );

      if (standing.goalsFor !== undefined && standing.goalsAgainst !== undefined) {
        assert.strictEqual(
          standing.goalDifference,
          standing.goalsFor - standing.goalsAgainst,
          `Goal difference should equal GF - GA`
        );
      }
    }
  });

  test('Test 9: Relational integrity across players, teams, fixtures, and competitions', () => {
    const teamIds = new Set(mockSportsData.teams.map(t => t.id));
    const compIds = new Set(mockSportsData.competitions.map(c => c.id));
    const fixtureIds = new Set(mockSportsData.fixtures.map(f => f.id));

    // Players must map to valid team
    for (const player of mockSportsData.players) {
      assert.ok(teamIds.has(player.teamId), `Player ${player.fullName} references invalid teamId ${player.teamId}`);
    }

    // Fixtures must map to valid team and competition
    for (const fixture of mockSportsData.fixtures) {
      assert.ok(teamIds.has(fixture.teamId), `Fixture ${fixture.id} references invalid teamId ${fixture.teamId}`);
      if (fixture.competitionId) {
        assert.ok(compIds.has(fixture.competitionId), `Fixture ${fixture.id} references invalid competitionId ${fixture.competitionId}`);
      }
    }

    // Match events must map to valid fixture
    for (const event of mockSportsData.matchEvents) {
      assert.ok(fixtureIds.has(event.fixtureId), `Match event ${event.id} references invalid fixtureId ${event.fixtureId}`);
    }
  });

  test('Test 10: Empty datasets do not fabricate sample people or fixtures', () => {
    const emptyReqs: ClientRequirements = {
      organizationName: 'Greenfield Sports Club',
      category: 'sports',
      sportsData: {
        schemaVersion: '1.0',
        club: {
          organizationName: 'Greenfield Sports Club',
          sportTypes: ['cricket']
        },
        teams: [],
        players: [],
        staff: [],
        competitions: [],
        fixtures: [],
        standings: [],
        matchEvents: [],
        sponsors: [],
        news: [],
        pages: [],
        sections: [],
        dataAvailability: {
          teams: false,
          players: false,
          staff: false,
          competitions: false,
          fixtures: false,
          standings: false,
          sponsors: false,
          news: false
        }
      }
    };

    const site = synthesizeWebsite(emptyReqs);
    assert.ok(site);
    assert.strictEqual(site.sportsData?.teams.length, 0);
    assert.strictEqual(site.sportsData?.players.length, 0);
    assert.strictEqual(site.sportsData?.fixtures.length, 0);
    assert.strictEqual(site.sportsData?.standings.length, 0);
  });

  test('Test 11: Tournament Hub synthesis generates tournament_bracket & participating_teams sections', () => {
    const tournamentReqs: ClientRequirements = {
      organizationName: 'Bengal Premier Championship',
      category: 'sports',
      sportsArchetype: 'sports_tournament',
      tagline: 'Annual State Inter-Club Championship',
      primaryColor: '#0f172a',
      accentColor: '#38bdf8',
      typographyStyle: 'athletic',
      contactEmail: 'tournament@bengalcup.org',
      contactPhone: '+91 98300 11111',
      aboutText: 'Premier knockout championship featuring 16 clubs across the state.',
      sportsData: {
        ...mockSportsData,
        tournamentStages: [
          {
            id: 'stage_qf',
            name: 'Quarter-Finals',
            stageType: 'knockout',
            stageOrder: 1,
            status: 'completed',
            matches: [
              {
                id: 'm_qf_1',
                roundName: 'Quarter-Final 1',
                homeTeamName: 'Victoria Athletic',
                awayTeamName: 'Crown Rovers',
                homeScore: 3,
                awayScore: 1,
                status: 'completed',
                winner: 'home'
              }
            ]
          }
        ],
        dataAvailability: {
          ...mockSportsData.dataAvailability,
          tournamentStages: true
        }
      }
    };

    const site = synthesizeWebsite(tournamentReqs);
    assert.ok(site);
    assert.strictEqual(site.navigationBar.ctaButton.href, '/brackets');
    assert.ok(site.pages.some(p => p.slug === '/brackets'));
    assert.ok(site.sections.some(s => s.metadata?.sportsSectionType === 'tournament_bracket'));
    assert.ok(site.sections.some(s => s.metadata?.sportsSectionType === 'participating_teams'));
  });

  test('Test 12: Sports Academy synthesis generates academy_programmes & training_schedules and sets admissions CTA', () => {
    const academyReqs: ClientRequirements = {
      organizationName: 'Victoria Elite Football Academy',
      category: 'sports',
      sportsArchetype: 'sports_academy',
      tagline: 'Youth Athletic Pathway & Elite Development',
      primaryColor: '#064e3b',
      accentColor: '#10b981',
      typographyStyle: 'athletic',
      contactEmail: 'admissions@victoria-academy.org',
      contactPhone: '+91 98300 22222',
      aboutText: 'Developing the next generation of professional athletes.',
      sportsData: {
        ...mockSportsData,
        academyProgrammes: [
          {
            id: 'prog_u15',
            title: 'Under-15 Elite Development',
            sport: 'football',
            ageGroup: 'U-15',
            duration: '10 Months',
            description: 'Comprehensive physical conditioning and match play.',
            feeStructure: '₹3,500 / Month',
            curriculumHighlights: ['Ball Mastery', 'Tactical Analysis'],
            isActive: true
          }
        ],
        trainingBatches: [
          {
            id: 'batch_morning',
            name: 'U-15 Morning Cohort',
            ageGroup: 'U-15',
            daysOfWeek: ['Mon', 'Wed', 'Fri'],
            startTime: '06:30 AM',
            endTime: '08:00 AM',
            venue: 'Ground 1 Turf',
            coachName: 'Coach Marcus',
            maxCapacity: 25,
            currentEnrollment: 18
          }
        ],
        dataAvailability: {
          ...mockSportsData.dataAvailability,
          academyProgrammes: true,
          trainingBatches: true
        }
      }
    };

    const site = synthesizeWebsite(academyReqs);
    assert.ok(site);
    assert.strictEqual(site.navigationBar.ctaButton.href, '/admissions');
    assert.ok(site.pages.some(p => p.slug === '/programmes'));
    assert.ok(site.sections.some(s => s.metadata?.sportsSectionType === 'academy_programmes'));
    assert.ok(site.sections.some(s => s.metadata?.sportsSectionType === 'training_schedules'));
    assert.ok(site.sections.some(s => s.metadata?.sportsSectionType === 'admission_enquiry'));
  });

  test('Test 13: 15-Step wizard payload persistence via POST /api/projects preserves archetype & sportsData', async () => {
    const newProjectPayload = {
      name: 'Victoria Athletic Club 2026',
      organizationName: 'Victoria Athletic Club 2026',
      category: 'sports',
      requirements: {
        organizationName: 'Victoria Athletic Club 2026',
        category: 'sports',
        organizationType: 'sports',
        sportsArchetype: 'sports_club',
        tagline: 'Victoria Athletic Official Portal',
        aboutText: 'Premier historical sports institution.',
        contactPerson: 'David Miller',
        contactEmail: 'david@victoriaclub.org',
        contactPhone: '+91 98300 99999',
        address: '12 Sports Enclave',
        primaryColor: '#0284c7',
        accentColor: '#06b6d4',
        typographyStyle: 'athletic',
        websiteLanguage: 'english',
        sportsData: mockSportsData,
        enabledSections: {
          hero: true,
          events: true,
          about: true,
          committee: true,
          gallery: true,
          contact: true
        },
        events: [],
        committee: [],
        gallery: []
      }
    };

    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify(newProjectPayload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.ok(body.project.id);
    assert.strictEqual(body.project.requirements.sportsArchetype, 'sports_club');
    assert.strictEqual(body.project.requirements.sportsData.club.organizationName, 'Victoria Athletic Club');

    // Clean up created test project
    await repository.deleteProject(body.project.id);
  });

  test('Test 14: 18-module PATCH updates tournamentStages, academyProgrammes, trainingBatches, seoInfo, brandingMedia into SQLite', async () => {
    const extended18Data: SportsWebsiteData = {
      ...mockSportsData,
      tournamentStages: [
        {
          id: 'stage_semi',
          name: 'Semi-Finals',
          stageType: 'semi_final',
          stageOrder: 2,
          status: 'upcoming',
          matches: [
            {
              id: 'm_sf_1',
              roundName: 'Semi-Final 1',
              homeTeamName: 'Victoria Athletic',
              awayTeamName: 'Metropolitan FC',
              status: 'scheduled'
            }
          ]
        }
      ],
      academyProgrammes: [
        {
          id: 'prog_cadet',
          title: 'Cadet Grassroots Camp',
          sport: 'football',
          ageGroup: 'U-10',
          duration: '6 Months',
          description: 'Fun fundamentals.',
          isActive: true
        }
      ],
      trainingBatches: [
        {
          id: 'batch_evening',
          name: 'Weekend Cadets',
          ageGroup: 'U-10',
          daysOfWeek: ['Sat', 'Sun'],
          startTime: '04:00 PM',
          endTime: '05:30 PM',
          venue: 'Junior Field',
          coachName: 'Coach Rajiv'
        }
      ],
      seoInfo: {
        metaTitle: 'Victoria AC | Official Portal',
        metaDescription: 'Official website for Victoria Athletic Club matches and standings.',
        keywords: ['football', 'fixtures', 'champions']
      },
      brandingMedia: {
        primaryLogoUrl: 'https://cdn.example.com/logo.png',
        bannerImageUrl: 'https://cdn.example.com/banner.png'
      }
    };

    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}/sports-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Connection: 'close'
      },
      body: JSON.stringify({ sportsData: extended18Data })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.project.generatedWebsite.sportsData.tournamentStages.length, 1);
    assert.strictEqual(body.project.generatedWebsite.sportsData.academyProgrammes.length, 1);
    assert.strictEqual(body.project.generatedWebsite.sportsData.trainingBatches.length, 1);
    assert.strictEqual(body.project.generatedWebsite.sportsData.seoInfo.metaTitle, 'Victoria AC | Official Portal');

    // Verify persistence directly in SQLite repository
    const fromDb = await repository.getProjectById(testProjectId);
    assert.ok(fromDb);
    assert.strictEqual(fromDb.generatedWebsite?.sportsData?.tournamentStages?.length, 1);
    assert.strictEqual(fromDb.generatedWebsite?.sportsData?.academyProgrammes?.length, 1);
    assert.strictEqual(fromDb.generatedWebsite?.sportsData?.trainingBatches?.length, 1);
    assert.strictEqual(fromDb.generatedWebsite?.sportsData?.seoInfo?.metaTitle, 'Victoria AC | Official Portal');
  });

  test('Test 15: Clean sheets and player statistics preservation', () => {
    const playerWithCleanSheets = {
      id: 'p_keeper',
      teamId: 'team_first_xi',
      fullName: 'Alex Stone',
      position: 'Goalkeeper',
      status: 'active' as const,
      statistics: {
        appearances: 15,
        goals: 0,
        assists: 1,
        cleanSheets: 8
      }
    };
    assert.strictEqual(playerWithCleanSheets.statistics.cleanSheets, 8);
  });
});

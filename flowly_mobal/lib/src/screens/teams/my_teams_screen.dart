import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:meu_app/src/models/team.dart';
import 'package:meu_app/src/services/auth_service.dart';
import 'package:meu_app/src/services/team_service.dart';
import 'package:meu_app/src/widgets/app_navigation_drawer.dart';
import 'package:meu_app/src/widgets/auth_background.dart';

class MyTeamsScreen extends StatefulWidget {
  const MyTeamsScreen({super.key});

  @override
  State<MyTeamsScreen> createState() => _MyTeamsScreenState();
}

class _MyTeamsScreenState extends State<MyTeamsScreen> {
  final TeamService _teamService = TeamService();
  final AuthService _authService = AuthService();
  Future<List<Team>>? _teamsFuture;

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  void _loadTeams() {
    setState(() {
      _teamsFuture = _teamService.listarMinhasEquipes();
    });
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (!mounted) {
      return;
    }
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final bool compact = MediaQuery.of(context).size.width < 390;
    return AuthBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        drawer: AppNavigationDrawer(
          currentRoute: '/equipes/minhas',
          onLogout: _logout,
        ),
        appBar: AppBar(title: const Text('Minhas Equipes')),
        body: FutureBuilder<List<Team>>(
          future: _teamsFuture,
          builder: (BuildContext context, AsyncSnapshot<List<Team>> snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Text('Erro ao carregar equipes: ${snapshot.error}'),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _loadTeams,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final List<Team> teams = snapshot.data ?? <Team>[];
            if (teams.isEmpty) {
              return RefreshIndicator(
                onRefresh: () async => _loadTeams(),
                child: ListView(
                  children: const <Widget>[
                    SizedBox(height: 160),
                    Center(child: Text('Você não está em nenhuma equipe.')),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _loadTeams(),
              child: ListView(
                padding: EdgeInsets.all(compact ? 12 : 16),
                children: <Widget>[
                  Container(
                    padding: EdgeInsets.all(compact ? 14 : 16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: <Color>[Color(0xFF152742), Color(0xFF1E4FA8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: <Widget>[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              'Equipes vinculadas',
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Visualização simples das suas equipes',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.white70),
                            ),
                          ],
                        ),
                        CircleAvatar(
                          radius: compact ? 20 : 24,
                          backgroundColor: Colors.white24,
                          child: Text(
                            teams.length.toString(),
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: compact ? 14 : 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: compact ? 10 : 14),
                  ...teams.map((Team team) {
                    return Card(
                      margin: EdgeInsets.only(bottom: compact ? 12 : 14),
                      child: ListTile(
                        leading: const Icon(Icons.groups_outlined),
                        title: Text(team.nome),
                        subtitle: Text('${team.membros.length} membros'),
                      ),
                    );
                  }),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

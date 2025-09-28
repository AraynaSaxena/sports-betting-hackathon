import requests
import json
import pandas as pd
import nfl_data_py as nfl
from typing import Dict, Optional, List
import time
from datetime import datetime, timedelta

class StatsService:
    def __init__(self):
        """Initialize the NFL stats service"""
        print("📊 Initializing NFL Stats Service...")
        
        # Load current season data
        self.current_season = 2024
        self.player_cache = {}
        self.cache_expiry = 3600  # 1 hour cache
        
        # Load NFL player data
        try:
            self._load_nfl_data()
            print("✅ NFL data loaded successfully")
        except Exception as e:
            print(f"⚠️ Error loading NFL data: {e}")
            self._load_fallback_data()
    
    def _load_nfl_data(self):
        """Load real NFL data using nfl_data_py"""
        try:
            # Load roster data
            self.rosters = nfl.import_rosters([self.current_season])
            
            # Load weekly stats
            self.weekly_stats = nfl.import_weekly_data([self.current_season])
            
            # Create jersey number to player mapping
            self.jersey_to_player = {}
            
            for _, player in self.rosters.iterrows():
                jersey_num = player.get('jersey_number')
                if pd.notna(jersey_num):
                    jersey_num = int(jersey_num)
                    if jersey_num not in self.jersey_to_player:
                        self.jersey_to_player[jersey_num] = []
                    
                    self.jersey_to_player[jersey_num].append({
                        'player_id': player.get('player_id'),
                        'display_name': player.get('display_name'),
                        'position': player.get('position'),
                        'team': player.get('team'),
                        'height': player.get('height'),
                        'weight': player.get('weight'),
                        'college': player.get('college'),
                        'years_exp': player.get('years_exp')
                    })
            
        except Exception as e:
            print(f"Error loading NFL data: {e}")
            raise e
    
    def _load_fallback_data(self):
        """Load fallback data if NFL API fails"""
        print("📋 Loading fallback player data...")
        
        # Fallback player database with common jersey numbers
        self.fallback_players = {
            12: {
                'display_name': 'Tom Brady',
                'position': 'QB',
                'team': 'TB',
                'stats': {
                    'passing_yards': 4694,
                    'passing_tds': 25,
                    'interceptions': 12,
                    'completions': 485,
                    'attempts': 719,
                    'completion_percentage': 67.5,
                    'passer_rating': 90.7
                }
            },
            13: {
                'display_name': 'Mike Evans',
                'position': 'WR',
                'team': 'TB',
                'stats': {
                    'receiving_yards': 1006,
                    'receiving_tds': 13,
                    'receptions': 74,
                    'targets': 124,
                    'yards_per_reception': 13.6,
                    'longest_reception': 55
                }
            },
            87: {
                'display_name': 'Rob Gronkowski',
                'position': 'TE',
                'team': 'TB',
                'stats': {
                    'receiving_yards': 802,
                    'receiving_tds': 6,
                    'receptions': 55,
                    'targets': 87,
                    'yards_per_reception': 14.6,
                    'longest_reception': 46
                }
            },
            9: {
                'display_name': 'Joe Burrow',
                'position': 'QB',
                'team': 'CIN',
                'stats': {
                    'passing_yards': 4611,
                    'passing_tds': 35,
                    'interceptions': 12,
                    'completions': 366,
                    'attempts': 520,
                    'completion_percentage': 70.4,
                    'passer_rating': 108.3
                }
            },
            1: {
                'display_name': 'Ja\'Marr Chase',
                'position': 'WR',
                'team': 'CIN',
                'stats': {
                    'receiving_yards': 1455,
                    'receiving_tds': 13,
                    'receptions': 81,
                    'targets': 128,
                    'yards_per_reception': 18.0,
                    'longest_reception': 70
                }
            },
            22: {
                'display_name': 'Derrick Henry',
                'position': 'RB',
                'team': 'TEN',
                'stats': {
                    'rushing_yards': 1538,
                    'rushing_tds': 13,
                    'rushing_attempts': 349,
                    'yards_per_carry': 4.4,
                    'longest_rush': 76,
                    'fumbles': 4
                }
            }
        }
        
        self.jersey_to_player = {}
        for jersey_num, player_data in self.fallback_players.items():
            self.jersey_to_player[jersey_num] = [player_data]
    
    def get_player_stats(self, jersey_number: int) -> Optional[Dict]:
        """Get basic stats for a player by jersey number"""
        try:
            # Check cache first
            cache_key = f"player_{jersey_number}"
            if cache_key in self.player_cache:
                cached_data = self.player_cache[cache_key]
                if time.time() - cached_data['timestamp'] < self.cache_expiry:
                    return cached_data['data']
            
            # Get player info
            players = self.jersey_to_player.get(jersey_number, [])
            
            if not players:
                return None
            
            # For multiple players with same number, return the first one
            # In a real app, you'd use team context to disambiguate
            player = players[0]
            
            # Get stats
            if hasattr(self, 'fallback_players') and jersey_number in self.fallback_players:
                # Use fallback data
                stats = self.fallback_players[jersey_number]['stats']
            else:
                # Get real stats from NFL data
                stats = self._get_real_player_stats(player.get('player_id'))
            
            result = {
                'jersey_number': jersey_number,
                'name': player.get('display_name'),
                'position': player.get('position'),
                'team': player.get('team'),
                'stats': stats,
                'context': self._generate_context(player, stats)
            }
            
            # Cache the result
            self.player_cache[cache_key] = {
                'data': result,
                'timestamp': time.time()
            }
            
            return result
            
        except Exception as e:
            print(f"Error getting player stats for #{jersey_number}: {e}")
            return None
    
    def _get_real_player_stats(self, player_id: str) -> Dict:
        """Get real stats from NFL data"""
        try:
            # Filter stats for this player
            player_stats = self.weekly_stats[self.weekly_stats['player_id'] == player_id]
            
            if player_stats.empty:
                return {}
            
            # Aggregate season stats
            stats = {}
            
            # Passing stats
            if 'passing_yards' in player_stats.columns:
                stats['passing_yards'] = int(player_stats['passing_yards'].sum())
                stats['passing_tds'] = int(player_stats['passing_tds'].sum())
                stats['interceptions'] = int(player_stats['interceptions'].sum())
                stats['completions'] = int(player_stats['completions'].sum())
                stats['attempts'] = int(player_stats['attempts'].sum())
                
                if stats['attempts'] > 0:
                    stats['completion_percentage'] = round((stats['completions'] / stats['attempts']) * 100, 1)
            
            # Rushing stats
            if 'rushing_yards' in player_stats.columns:
                stats['rushing_yards'] = int(player_stats['rushing_yards'].sum())
                stats['rushing_tds'] = int(player_stats['rushing_tds'].sum())
                stats['rushing_attempts'] = int(player_stats['carries'].sum())
                
                if stats['rushing_attempts'] > 0:
                    stats['yards_per_carry'] = round(stats['rushing_yards'] / stats['rushing_attempts'], 1)
            
            # Receiving stats
            if 'receiving_yards' in player_stats.columns:
                stats['receiving_yards'] = int(player_stats['receiving_yards'].sum())
                stats['receiving_tds'] = int(player_stats['receiving_tds'].sum())
                stats['receptions'] = int(player_stats['receptions'].sum())
                stats['targets'] = int(player_stats['targets'].sum())
                
                if stats['receptions'] > 0:
                    stats['yards_per_reception'] = round(stats['receiving_yards'] / stats['receptions'], 1)
            
            return stats
            
        except Exception as e:
            print(f"Error getting real player stats: {e}")
            return {}
    
    def get_detailed_player_stats(self, jersey_number: int) -> Optional[Dict]:
        """Get detailed stats including recent performance"""
        basic_stats = self.get_player_stats(jersey_number)
        
        if not basic_stats:
            return None
        
        # Add recent game performance
        try:
            recent_games = self._get_recent_games(basic_stats.get('name'))
            basic_stats['recent_games'] = recent_games
        except:
            basic_stats['recent_games'] = []
        
        # Add betting insights
        basic_stats['betting_insights'] = self._generate_betting_insights(basic_stats)
        
        return basic_stats
    
    def _get_recent_games(self, player_name: str) -> List[Dict]:
        """Get recent game performance"""
        # This would query recent games from the database
        # For now, return mock data
        return [
            {'week': 'Week 15', 'opponent': 'vs DAL', 'performance': 'Good'},
            {'week': 'Week 14', 'opponent': '@ BUF', 'performance': 'Excellent'},
            {'week': 'Week 13', 'opponent': 'vs MIA', 'performance': 'Average'}
        ]
    
    def _generate_context(self, player: Dict, stats: Dict) -> str:
        """Generate contextual information about the player"""
        position = player.get('position', 'Unknown')
        
        if position == 'QB':
            yards = stats.get('passing_yards', 0)
            tds = stats.get('passing_tds', 0)
            return f"Leading the offense with {yards} passing yards and {tds} TDs this season"
        
        elif position in ['WR', 'TE']:
            yards = stats.get('receiving_yards', 0)
            tds = stats.get('receiving_tds', 0)
            return f"Key receiving target with {yards} receiving yards and {tds} TDs"
        
        elif position == 'RB':
            yards = stats.get('rushing_yards', 0)
            tds = stats.get('rushing_tds', 0)
            return f"Ground game leader with {yards} rushing yards and {tds} TDs"
        
        else:
            return f"Key {position} contributing to team success"
    
    def get_betting_context(self, stats: Dict) -> Dict:
        """Generate betting-relevant context"""
        if not stats:
            return {}
        
        context = {
            'hot_streak': False,
            'risk_level': 'medium',
            'key_metrics': [],
            'betting_tips': []
        }
        
        # Analyze performance trends
        if 'passing_yards' in stats:
            yards = stats['passing_yards']
            if yards > 4000:
                context['hot_streak'] = True
                context['key_metrics'].append(f"{yards} passing yards")
                context['betting_tips'].append("Strong passing performance expected")
        
        if 'receiving_yards' in stats:
            yards = stats['receiving_yards']
            if yards > 1000:
                context['hot_streak'] = True
                context['key_metrics'].append(f"{yards} receiving yards")
                context['betting_tips'].append("Reliable receiving target")
        
        return context
    
    def _generate_betting_insights(self, player_stats: Dict) -> Dict:
        """Generate betting insights for the player"""
        insights = {
            'over_under_predictions': {},
            'prop_bet_suggestions': [],
            'risk_assessment': 'medium'
        }
        
        stats = player_stats.get('stats', {})
        position = player_stats.get('position')
        
        if position == 'QB':
            # Passing yards over/under
            avg_yards = stats.get('passing_yards', 0) / 17  # Assuming 17 games
            insights['over_under_predictions']['passing_yards'] = {
                'line': round(avg_yards),
                'recommendation': 'over' if avg_yards > 250 else 'under',
                'confidence': 0.7
            }
            
            insights['prop_bet_suggestions'].append("Completion percentage over 65%")
            insights['prop_bet_suggestions'].append("2+ touchdown passes")
        
        elif position in ['WR', 'TE']:
            avg_yards = stats.get('receiving_yards', 0) / 17
            insights['over_under_predictions']['receiving_yards'] = {
                'line': round(avg_yards),
                'recommendation': 'over' if avg_yards > 60 else 'under',
                'confidence': 0.6
            }
            
            insights['prop_bet_suggestions'].append("5+ receptions")
            insights['prop_bet_suggestions'].append("Touchdown reception")
        
        return insights

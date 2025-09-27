# NFL Team Rosters - Add your teams and players here
# Format: ROSTER[team_abbr][jersey_number] = player_info

ROSTER = {
    "PHI": {  # Philadelphia Eagles
        1: {
            "name": "Jalen Hurts",
            "position": "QB",
            "height": "6'1\"",
            "weight": "223",
            "college": "Alabama/Oklahoma",
            "number": 1
        },
        6: {
            "name": "DeVonta Smith", 
            "position": "WR",
            "height": "6'0\"",
            "weight": "170",
            "college": "Alabama",
            "number": 6
        },
        11: {
            "name": "A.J. Brown",
            "position": "WR", 
            "height": "6'1\"",
            "weight": "226",
            "college": "Ole Miss",
            "number": 11
        },
        26: {
            "name": "Saquon Barkley",
            "position": "RB",
            "height": "6'0\"",
            "weight": "233", 
            "college": "Penn State",
            "number": 26
        },
        88: {
            "name": "Dallas Goedert",
            "position": "TE",
            "height": "6'5\"",
            "weight": "256",
            "college": "South Dakota State", 
            "number": 88
        }
    },
    "TEN": {  # Tennessee Titans
        7: {
            "name": "Will Levis",
            "position": "QB",
            "height": "6'4\"",
            "weight": "229",
            "college": "Kentucky",
            "number": 7
        },
        22: {
            "name": "Derrick Henry",
            "position": "RB", 
            "height": "6'3\"",
            "weight": "247",
            "college": "Alabama",
            "number": 22
        },
        10: {
            "name": "DeAndre Hopkins",
            "position": "WR",
            "height": "6'1\"", 
            "weight": "212",
            "college": "Clemson",
            "number": 10
        },
        15: {
            "name": "Nick Westbrook-Ikhine",
            "position": "WR",
            "height": "6'2\"",
            "weight": "227",
            "college": "Indiana",
            "number": 15
        }
    },
    "TB": {  # Tampa Bay Buccaneers (for your existing data)
        12: {
            "name": "Tom Brady",
            "position": "QB", 
            "height": "6'4\"",
            "weight": "225",
            "college": "Michigan",
            "number": 12
        },
        13: {
            "name": "Mike Evans",
            "position": "WR",
            "height": "6'5\"", 
            "weight": "231",
            "college": "Texas A&M",
            "number": 13
        },
        87: {
            "name": "Rob Gronkowski", 
            "position": "TE",
            "height": "6'6\"",
            "weight": "265",
            "college": "Arizona",
            "number": 87
        }
    }
}

# Helper function to add players easily
def add_player(team_abbr, number, name, position, height="", weight="", college=""):
    """Add a player to the roster"""
    if team_abbr not in ROSTER:
        ROSTER[team_abbr] = {}
    
    ROSTER[team_abbr][number] = {
        "name": name,
        "position": position, 
        "height": height,
        "weight": weight,
        "college": college,
        "number": number
    }

# Example usage:
# add_player("PHI", 20, "Reed Blankenship", "S", "6'1\"", "204", "Middle Tennessee")

if __name__ == "__main__":
    # Print roster for verification
    for team, players in ROSTER.items():
        print(f"\n{team} Roster:")
        for num, player in sorted(players.items()):
            print(f"  #{num:2d} {player['name']:20s} {player['position']:3s}")

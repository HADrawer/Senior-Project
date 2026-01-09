def generate_plan(data):
    interests = ", ".join(data.interests)

    prompt = f"""
    Create a personalized tourism plan in Bahrain.
    Interests: {interests}
    Budget: {data.budget}
    Available time per day: {data.available_time} hours
    Trip days: {data.trip_days}
    """

    # حالياً Mock Response
    return {
        "day1": [
            "Bahrain Fort",
            "Muharraq Souq",
            "Lunch at Haji Cafe"
        ]
    }

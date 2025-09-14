import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BASE_URL from '../api/Api';
const API_URL = `${BASE_URL}/reviews.php`; 

const Review = () => {
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState('');
    const [error, setError] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            const result = await response.json();
            
            if (result.status === 'success') {
                // Transform API data to match the component's expected format
                const formattedReviews = result.data.map(item => ({
                    id: item.id,
                    user_id: item.user_id,
                    name: item.name,
                    text: item.feedback,
                    rating: parseInt(item.stars),
                    email: item.email,
                    date: new Date(item.updated_at).toLocaleString(),
                }));
                setReviews(formattedReviews);
            } else {
                setError('Failed to load reviews: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReview = async () => {
        if (newReview.trim() === '') {
            setError('Review cannot be empty');
            return;
        }
        if (rating === 0) {
            setError('Please provide a rating');
            return;
        }
        setError('');
        
        // Note: This is a placeholder. In a real app, you would implement
        // the POST request to your API to add a new review
        Alert.alert(
            "Feature Not Implemented",
            "Adding reviews through the API is not implemented in this example.",
            [{ text: "OK" }]
        );
        
        // After successfully adding, refresh the reviews list
        // fetchReviews();
        
        setNewReview('');
        setRating(0);
    };


    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>User Reviews ({reviews.length})</Text>
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <TouchableOpacity style={styles.refreshButton} onPress={fetchReviews}>
                <Ionicons name="refresh" size={18} color="white" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
            
            <FlatList
                data={reviews}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewerName}>{item.name}</Text>
                            <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                        <Text style={styles.reviewText}>{item.text}</Text>
                        <View style={styles.footerRow}>
                            <View style={styles.ratingContainer}>
                                {[...Array(item.rating)].map((_, i) => (
                                    <Ionicons key={i} name="star" size={16} color="gold" />
                                ))}
                                {[...Array(5 - item.rating)].map((_, i) => (
                                    <Ionicons key={i + item.rating} name="star-outline" size={16} color="gold" />
                                ))}
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.noReviews}>No reviews yet.</Text>}
                contentContainerStyle={reviews.length === 0 ? styles.emptyContainer : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginBottom: 10,
        alignSelf: 'center',
    },
    refreshButtonText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    reviewItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reviewerName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    reviewText: {
        fontSize: 16,
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: 'gray',
    },
    noReviews: {
        textAlign: 'center',
        color: 'gray',
        padding: 20,
    },
    emptyContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    addReviewContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginVertical: 10,
        borderRadius: 5,
        backgroundColor: 'white',
        minHeight: 80,
    },
    starIcon: {
        marginHorizontal: 2,
    },
    button: {
        backgroundColor: '#0066cc',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        marginVertical: 10,
        textAlign: 'center',
    },
});

export default Review;
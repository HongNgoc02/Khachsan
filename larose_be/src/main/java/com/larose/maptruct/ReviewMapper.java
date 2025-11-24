package com.larose.maptruct;

import com.larose.dto.ReviewDTO;
import com.larose.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "videos", ignore = true)
    ReviewDTO toDTO(Review review);

    @Mapping(target = "images", ignore = true)
    @Mapping(target = "videos", ignore = true)
    Review toReview(ReviewDTO reviewDTO);
}

import { elasticClient } from '../utils/elasticClient.js';
import { ObjectId } from 'mongodb';

// Tên index
const EXPERTS_INDEX = 'experts';

// Kiểm tra xem index có tồn tại không
const indexExists = async (indexName) => {
  try {
    return await elasticClient.indices.exists({ index: indexName });
  } catch (error) {
    console.error(`Lỗi kiểm tra index ${indexName}:`, error);
    return false;
  }
};

// Tạo index với mapping tối ưu
const createExpertsIndex = async () => {
  try {
    const exists = await indexExists(EXPERTS_INDEX);
    
    if (!exists) {
      await elasticClient.indices.create({
        index: EXPERTS_INDEX,
        body: {
          settings: {
            index: {
              number_of_shards: 1,         // Giảm số shards phù hợp với dev/local
              number_of_replicas: 0,       // Không cần replica trong môi trường dev
              refresh_interval: "5s"       // Tăng refresh interval
            },
            analysis: {
              analyzer: {
                vietnamese_analyzer: {
                  tokenizer: "standard",
                  filter: ["lowercase", "asciifolding"]
                },
                edge_ngram_analyzer: {     // Thêm analyzer mới cho tìm kiếm prefixes
                  tokenizer: "edge_ngram_tokenizer",
                  filter: ["lowercase", "asciifolding"]
                },
                search_analyzer: {         // Analyzer riêng cho tìm kiếm
                  tokenizer: "standard",
                  filter: ["lowercase", "asciifolding"]
                }
              },
              tokenizer: {
                edge_ngram_tokenizer: {
                  type: "edge_ngram",
                  min_gram: 2,
                  max_gram: 10,
                  token_chars: ["letter", "digit"]
                }
              }
            }
          },
          mappings: {
            properties: {
              name: { 
                type: "text",
                analyzer: "vietnamese_analyzer",
                search_analyzer: "search_analyzer",
                fields: {
                  keyword: { type: "keyword" },
                  ngram: {
                    type: "text",
                    analyzer: "edge_ngram_analyzer",
                    search_analyzer: "search_analyzer"
                  }
                }
              },
              field: { type: "keyword" },
              expertise: { 
                type: "text",
                analyzer: "vietnamese_analyzer" 
              },
              experience: { 
                type: "text",
                analyzer: "vietnamese_analyzer" 
              },
              price: { type: "float" },
              rating: { type: "float" },
              reviewCount: { type: "integer" },
              verified: { type: "keyword" },
              role: { type: "keyword" },
              email: { type: "keyword" },
              avatar: { type: "keyword" },
              createdAt: { 
                type: "date",
                format: "strict_date_optional_time||epoch_millis"
              }
            }
          }
        }
      });
      
      console.log(`Đã tạo index ${EXPERTS_INDEX}`);
      return true;
    }
    
    console.log(`Index ${EXPERTS_INDEX} đã tồn tại`);
    return false;
  } catch (error) {
    console.error(`Lỗi tạo index ${EXPERTS_INDEX}:`, error);
    throw error;
  }
};

// Thêm hoặc cập nhật một chuyên gia trong Elasticsearch
const indexExpert = async (expert) => {
  try {
    // Đảm bảo _id là string
    const id = expert._id.toString();
    
    // Loại bỏ mật khẩu và _id khỏi dữ liệu
    const { password, _id, ...expertData } = expert;
    
    // Lưu ý: KHÔNG thêm _id vào document, chỉ sử dụng làm id
    await elasticClient.index({
      index: EXPERTS_INDEX,
      id: id,
      document: expertData
    });
    
    return true;
  } catch (error) {
    console.error('Lỗi khi index chuyên gia:', error);
    return false;
  }
};

// Xóa một chuyên gia khỏi Elasticsearch
const deleteExpert = async (id) => {
  try {
    // Kiểm tra xem document có tồn tại không
    const exists = await elasticClient.exists({
      index: EXPERTS_INDEX,
      id: id.toString()
    });
    
    if (exists) {
      await elasticClient.delete({
        index: EXPERTS_INDEX,
        id: id.toString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa chuyên gia:', error);
    return false;
  }
};

// Tìm kiếm chuyên gia với query tối ưu hóa
const searchExperts = async (query, filters = {}, limit = 12, cursor = null) => {
  try {
    const totalStart = process.hrtime();
    console.log('[Elasticsearch] Bắt đầu tìm kiếm...');
    
    // Đo thời gian tạo search query
    const queryBuildStart = process.hrtime();
    
    // Tạo search query tối ưu
    let searchBody = {
      size: limit,
      sort: [
        { "rating": "desc" },         // Sắp xếp theo rating
        { "createdAt": "desc" }       // Sau đó theo thời gian tạo
      ]
    };
    
    // Nếu có từ khóa tìm kiếm, sử dụng function_score với boosting
    if (query && query.trim() !== '') {
      searchBody.query = {
        function_score: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    "name": {
                      query: query,
                      boost: 3.0,
                      operator: "and"
                    }
                  }
                },
                {
                  match: {
                    "name.ngram": {
                      query: query,
                      boost: 1.0
                    }
                  }
                },
                // Thêm match_phrase để ưu tiên kết quả khớp chính xác cụm từ
                {
                  match_phrase: {
                    "name": {
                      query: query,
                      boost: 4.0,
                      slop: 1
                    }
                  }
                }
              ],
              filter: [
                { term: { role: "expert" } },
                { term: { verified: "verified" } }
              ],
              minimum_should_match: 1  // Yêu cầu ít nhất 1 điều kiện should phải khớp
            }
          },
          field_value_factor: {
            field: "rating",
            factor: 1.2,
            modifier: "log1p",
            missing: 0
          },
          boost_mode: "multiply"
        }
      };
      
      // Thêm sort theo score khi có từ khóa tìm kiếm
      searchBody.sort.unshift({ "_score": "desc" });
    } else {
      // Nếu không có từ khóa tìm kiếm, chỉ sử dụng filter query
      searchBody.query = {
        bool: {
          filter: [
            { term: { role: "expert" } },
            { term: { verified: "verified" } }
          ]
        }
      };
    }
    
    // Thêm filter theo field
    if (filters.field) {
      searchBody.query.bool ? 
        searchBody.query.bool.filter.push({ term: { field: filters.field } }) :
        searchBody.query.function_score.query.bool.filter.push({ term: { field: filters.field } });
    }
    
    // Thêm filter theo khoảng giá
    if (filters.price) {
      const priceRange = { range: { price: {} } };
      
      if (filters.price.$gte !== undefined) {
        priceRange.range.price.gte = filters.price.$gte;
      }
      
      if (filters.price.$lte !== undefined) {
        priceRange.range.price.lte = filters.price.$lte;
      }
      
      searchBody.query.bool ? 
        searchBody.query.bool.filter.push(priceRange) :
        searchBody.query.function_score.query.bool.filter.push(priceRange);
    }
    
    // Thêm filter theo rating
    if (filters.rating && filters.rating.$gte !== undefined) {
      const ratingRange = { range: { rating: { gte: filters.rating.$gte } } };
      
      searchBody.query.bool ? 
        searchBody.query.bool.filter.push(ratingRange) :
        searchBody.query.function_score.query.bool.filter.push(ratingRange);
    }
    
    // Áp dụng search_after cho cursor pagination
    if (cursor) {
      try {
        const cursorValues = JSON.parse(cursor);
        searchBody.search_after = cursorValues;
      } catch (e) {
        console.error('Lỗi parse cursor:', e);
      }
    }
    
    const queryBuildEnd = process.hrtime(queryBuildStart);
    const queryBuildTime = queryBuildEnd[0] * 1000 + queryBuildEnd[1] / 1000000;
    console.log(`[Elasticsearch] Thời gian tạo query: ${queryBuildTime.toFixed(2)}ms`);
    
    console.log('Search body:', JSON.stringify(searchBody, null, 2));
    
    // Đo thời gian thực hiện tìm kiếm với Elasticsearch
    const searchStart = process.hrtime();
    
    // Thực hiện tìm kiếm
    const result = await elasticClient.search({
      index: EXPERTS_INDEX,
      body: searchBody
    });
    
    const searchEnd = process.hrtime(searchStart);
    const searchTime = searchEnd[0] * 1000 + searchEnd[1] / 1000000;
    console.log(`[Elasticsearch] Thời gian thực hiện search request: ${searchTime.toFixed(2)}ms`);
    
    // Đo thời gian xử lý kết quả
    const processStart = process.hrtime();
    
    // Xử lý kết quả
    const experts = result.hits.hits.map(hit => ({
      ...hit._source,
      _id: hit._id,
      _score: hit._score
    }));
    
    // Xác định cursor tiếp theo dựa trên các trường đã sort
    let nextCursor = null;
    if (experts.length > 0) {
      // Lấy các giá trị tương ứng từ kết quả cuối cùng để tạo cursor
      const lastHit = result.hits.hits[result.hits.hits.length - 1];
      const sortValues = lastHit.sort || [
        lastHit._score || 0,
        experts[experts.length - 1].rating || 0,
        experts[experts.length - 1].createdAt || new Date().toISOString()
      ];
      nextCursor = JSON.stringify(sortValues);
    }
    
    const hasMore = experts.length === limit;
    
    const processEnd = process.hrtime(processStart);
    const processTime = processEnd[0] * 1000 + processEnd[1] / 1000000;
    console.log(`[Elasticsearch] Thời gian xử lý kết quả: ${processTime.toFixed(2)}ms`);
    
    // Tính tổng thời gian
    const totalEnd = process.hrtime(totalStart);
    const totalTime = totalEnd[0] * 1000 + totalEnd[1] / 1000000;
    console.log(`[Elasticsearch] Tổng thời gian thực hiện searchExperts: ${totalTime.toFixed(2)}ms`);
    
    return {
      experts,
      nextCursor,
      hasMore
    };
  } catch (error) {
    console.error('Lỗi khi tìm kiếm chuyên gia:', error);
    throw error;
  }
};

// Đếm số lượng document trong index
const countExperts = async () => {
  try {
    const result = await elasticClient.count({
      index: EXPERTS_INDEX
    });
    
    return result.count;
  } catch (error) {
    console.error('Lỗi khi đếm chuyên gia:', error);
    return 0;
  }
};

export default {
  indexExists,
  createExpertsIndex,
  indexExpert,
  deleteExpert,
  searchExperts,
  countExperts,
  EXPERTS_INDEX
}; 
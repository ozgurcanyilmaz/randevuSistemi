using System.Text.Json;
using System.Text.Json.Serialization;

namespace RandevuSistemi.Api.Services
{
    public interface IReCaptchaService
    {
        Task<bool> VerifyTokenAsync(string token);
    }

    public class ReCaptchaService : IReCaptchaService
    {
        private readonly HttpClient _httpClient;
        private readonly string _secretKey;
        private readonly ILogger<ReCaptchaService> _logger;

        public ReCaptchaService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ReCaptchaService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _secretKey = configuration["ReCaptcha:SecretKey"]
                ?? throw new InvalidOperationException("ReCaptcha SecretKey not configured");
        }

        public async Task<bool> VerifyTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("ReCaptcha token is empty");
                return false;
            }

            try
            {
                var url = $"https://www.google.com/recaptcha/api/siteverify?secret={_secretKey}&response={token}";

                var response = await _httpClient.PostAsync(url, null);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("ReCaptcha API returned status code: {StatusCode}", response.StatusCode);
                    return false;
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("ReCaptcha response: {Response}", jsonString);

                var result = JsonSerializer.Deserialize<ReCaptchaResponse>(jsonString, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result?.Success == true)
                {
                    _logger.LogInformation("ReCaptcha verification successful");
                    return true;
                }
                else
                {
                    _logger.LogWarning("ReCaptcha verification failed. Error codes: {ErrorCodes}",
                        string.Join(", ", result?.ErrorCodes ?? Array.Empty<string>()));
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception during ReCaptcha verification");
                return false;
            }
        }
    }

    public class ReCaptchaResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("challenge_ts")]
        public string? ChallengeTimestamp { get; set; }

        [JsonPropertyName("hostname")]
        public string? Hostname { get; set; }

        [JsonPropertyName("error-codes")]
        public string[] ErrorCodes { get; set; } = Array.Empty<string>();
    }
}